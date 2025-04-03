'use client';

import { useRef, useEffect, useState } from 'react';
import { audioManager } from '../utils/audioManager';
import { Forest } from '../data/forests';
import { IconButton } from './IconButton';
import { TbPictureInPicture, TbDeviceMobile } from 'react-icons/tb';

// Extend HTMLVideoElement with webkit-specific properties
declare global {
  interface HTMLVideoElement {
    webkitSupportsPresentationMode?: (mode: string) => boolean;
    webkitSetPresentationMode?: (mode: string) => void;
    webkitPresentationMode?: string;
  }
}

interface PiPMiniPlayerProps {
  forest: Forest | null;
  activeSounds: Set<string>;
  isVisible: boolean;
}

export default function PiPMiniPlayer({ forest, activeSounds, isVisible }: PiPMiniPlayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPiPActive, setIsPiPActive] = useState(false);
  const [isPiPSupported, setIsPiPSupported] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Add webkit-specific attributes using useEffect instead of inline JSX
  useEffect(() => {
    if (videoRef.current) {
      // iOS Safari requires these attributes for PiP to work properly
      videoRef.current.setAttribute("webkit-playsinline", "true");
      videoRef.current.setAttribute("x-webkit-airplay", "allow");
    }
  }, [videoRef.current]);

  // Check for device and PiP support on mount
  useEffect(() => {
    // Check if iOS device
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIOS(isIOSDevice);

    // Check PiP support
    const video = document.createElement('video');
    const hasPiPAPI = typeof video.requestPictureInPicture === 'function';
    const hasPiPEnabled = document.pictureInPictureEnabled;
    
    // iOS Safari doesn't support standard PiP API but has its own implementation
    const isIOSSafari = isIOSDevice && /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    const supportsPiP = isIOSSafari || (hasPiPAPI && hasPiPEnabled);
    
    setIsPiPSupported(supportsPiP);
    
    console.log('Device detection:', {
      isIOS: isIOSDevice,
      isIOSSafari,
      hasPiPAPI,
      hasPiPEnabled,
      supportsPiP
    });
  }, []);

  // Handle creating and updating the canvas with the forest image
  useEffect(() => {
    if (!canvasRef.current || !isVisible) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas size
    canvas.width = 640;
    canvas.height = 360;
    
    // Load and draw the forest image
    const loadImage = () => {
      if (!forest) return;
      
      const img = new Image();
      imageRef.current = img;
      img.crossOrigin = 'anonymous';
      img.src = forest.imageUrl;
      
      img.onload = () => {
        // Draw image to canvas
        const drawImage = () => {
          if (!ctx || !img) return;
          
          // Clear canvas
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          // Draw image (maintaining aspect ratio)
          const imgRatio = img.width / img.height;
          const canvasRatio = canvas.width / canvas.height;
          
          let drawWidth, drawHeight, x, y;
          
          if (imgRatio > canvasRatio) {
            // Image is wider than canvas (relative to height)
            drawHeight = canvas.height;
            drawWidth = img.width * (canvas.height / img.height);
            x = (canvas.width - drawWidth) / 2;
            y = 0;
          } else {
            // Image is taller than canvas (relative to width)
            drawWidth = canvas.width;
            drawHeight = img.height * (canvas.width / img.width);
            x = 0;
            y = (canvas.height - drawHeight) / 2;
          }
          
          ctx.drawImage(img, x, y, drawWidth, drawHeight);
          
          // Add forest name as text
          ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
          ctx.fillRect(0, canvas.height - 40, canvas.width, 40);
          ctx.font = '20px Arial';
          ctx.fillStyle = 'white';
          ctx.textAlign = 'center';
          ctx.fillText(forest.name, canvas.width / 2, canvas.height - 15);
          
          // Continue animation loop
          animationFrameRef.current = requestAnimationFrame(drawImage);
        };
        
        // Start animation loop
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        animationFrameRef.current = requestAnimationFrame(drawImage);
      };
    };
    
    loadImage();
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [forest, isVisible]);

  // Handle audio/video stream creation
  useEffect(() => {
    if (!canvasRef.current || !isVisible) return;
    
    // Function to create or update stream
    const setupStream = async () => {
      try {
        // Clean up previous stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          setIsPlaying(false);
        }
        
        // Get canvas stream for video
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const canvasStream = canvas.captureStream(30); // 30 FPS
        
        // Make sure audio manager is initialized
        if (!audioManager.audioContext) {
          await audioManager.initialize();
        }
        
        // Get the audio context
        const audioContext = audioManager.audioContext;
        if (!audioContext) {
          throw new Error('Audio context not available');
        }
        
        // Create a media stream destination
        const audioDestination = audioContext.createMediaStreamDestination();
        
        // Expose a method to connect audio nodes to this destination
        audioManager.connectToPiP = (source: AudioNode) => {
          source.connect(audioDestination);
        };
        
        // Connect all active sources to this destination
        audioManager.connectAllToPiP();
        
        // Add at least a silent audio track if no audio tracks
        let audioTracks = audioDestination.stream.getAudioTracks();
        if (audioTracks.length === 0) {
          console.log('No audio tracks, creating silent audio track');
          // Create a silent oscillator and connect it to the destination
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          gainNode.gain.value = 0.01; // Very quiet but not silent
          oscillator.connect(gainNode);
          gainNode.connect(audioDestination);
          oscillator.start();
          
          // Wait for the track to be created
          await new Promise(resolve => setTimeout(resolve, 100));
          audioTracks = audioDestination.stream.getAudioTracks();
        }
        
        // Combine video and audio tracks
        const combinedStream = new MediaStream([
          ...canvasStream.getVideoTracks(),
          ...audioTracks
        ]);
        
        // Save reference to the stream
        streamRef.current = combinedStream;
        
        // Set the stream as the video source
        if (videoRef.current) {
          videoRef.current.srcObject = combinedStream;
          try {
            // Auto-play the video
            const playPromise = videoRef.current.play();
            if (playPromise !== undefined) {
              playPromise
                .then(() => {
                  console.log('Video playback started successfully');
                  setIsPlaying(true);
                })
                .catch(error => {
                  console.error('Video playback failed:', error);
                  setIsPlaying(false);
                });
            }
          } catch (error) {
            console.error('Error auto-playing video:', error);
          }
        }
      } catch (error) {
        console.error('Failed to setup PiP stream:', error);
      }
    };
    
    setupStream();
    
    return () => {
      // Clean up
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      // Remove the PiP connection method
      if (audioManager.connectToPiP) {
        audioManager.connectToPiP = undefined;
      }
    };
  }, [isVisible, activeSounds]);

  // Handle Picture-in-Picture mode
  const enterPiPMode = async () => {
    try {
      if (!videoRef.current) return;
      
      // Make sure video has focus
      videoRef.current.focus();
      
      // Ensure video is playing (required for PiP)
      if (!isPlaying) {
        try {
          await videoRef.current.play();
          setIsPlaying(true);
        } catch (e) {
          console.error('Failed to play video before PiP:', e);
          // Try to trigger play from user interaction
          alert('Please tap on the video to start playback then try again. Audio playback requires user interaction on your device.');
          return;
        }
      }
      
      // Request PiP mode - different methods for different platforms
      if (isIOS) {
        // iOS uses webkitSetPresentationMode
        if (videoRef.current.webkitSupportsPresentationMode && 
            typeof videoRef.current.webkitSetPresentationMode === 'function') {
          videoRef.current.webkitSetPresentationMode('picture-in-picture');
          setIsPiPActive(true);
          
          // iOS doesn't have an event for leaving PiP, so we need to check periodically
          const checkInterval = setInterval(() => {
            if (videoRef.current && 
                videoRef.current.webkitPresentationMode !== 'picture-in-picture') {
              setIsPiPActive(false);
              clearInterval(checkInterval);
            }
          }, 1000);
        } else {
          throw new Error('iOS PiP not supported in this browser');
        }
      } else {
        // Standard PiP API
        await videoRef.current.requestPictureInPicture();
        setIsPiPActive(true);
        
        // Handle exiting PiP
        videoRef.current.addEventListener('leavepictureinpicture', () => {
          setIsPiPActive(false);
        });
      }
    } catch (error) {
      console.error('Failed to enter PiP mode:', error);
      alert('Failed to enter Picture-in-Picture mode. This may not be supported in your browser.');
    }
  };

  // Don't render if not visible
  if (!isVisible) return null;

  return (
    <div className="fixed bottom-20 right-4 z-50">
      <div className="bg-black rounded-lg overflow-hidden shadow-xl w-64">
        <div className="relative w-full aspect-video">
          {/* Canvas for drawing - hidden in final version */}
          <canvas 
            ref={canvasRef} 
            className="absolute inset-0 w-full h-full"
            style={{ display: 'none' }}
          />
          {/* Video element with controls */}
          <video 
            ref={videoRef} 
            className="w-full h-full"
            autoPlay 
            playsInline 
            controls
            loop
            muted={false}
            onClick={() => videoRef.current?.play()}
          />
          
          {/* Info overlay when not playing */}
          {!isPlaying && (
            <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center">
              <p className="text-white text-center p-4">
                Tap to start playback
              </p>
            </div>
          )}
        </div>
        <div className="p-2 flex justify-between items-center bg-gray-800">
          <span className="text-white text-sm truncate">
            {forest?.name || 'Select a forest'}
          </span>
          <div className="flex space-x-2">
            {isIOS && (
              <span className="text-white text-xs flex items-center">
                <TbDeviceMobile className="mr-1" size={16} />
                iOS
              </span>
            )}
            <IconButton 
              icon={TbPictureInPicture} 
              onClick={enterPiPMode} 
              variant="secondary"
              size="sm"
              tooltip={isPiPSupported ? "Open Picture-in-Picture" : "PiP not supported"}
              disabled={isPiPActive || !isPiPSupported}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 