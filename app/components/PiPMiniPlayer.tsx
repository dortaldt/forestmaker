'use client';

import { useRef, useEffect, useState } from 'react';
import { audioManager } from '../utils/audioManager';
import { Forest } from '../data/forests';
import { IconButton } from './IconButton';
import { TbPictureInPicture } from 'react-icons/tb';

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
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Check for PiP support on mount
  useEffect(() => {
    const video = document.createElement('video');
    setIsPiPSupported(
      typeof video.requestPictureInPicture === 'function' && 
      document.pictureInPictureEnabled
    );
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
    if (!canvasRef.current || !isVisible || !audioManager) return;
    
    // Function to create or update stream
    const setupStream = async () => {
      try {
        // Clean up previous stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
        
        // Get canvas stream for video
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const canvasStream = canvas.captureStream(30); // 30 FPS
        
        // Create audio destination node
        if (!audioManager.audioContext) {
          await audioManager.initialize();
        }
        
        // Get the audio context and create a destination
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
        
        // Combine video and audio tracks
        const combinedStream = new MediaStream([
          ...canvasStream.getVideoTracks(),
          ...audioDestination.stream.getAudioTracks()
        ]);
        
        // Save reference to the stream
        streamRef.current = combinedStream;
        
        // Set the stream as the video source
        if (videoRef.current) {
          videoRef.current.srcObject = combinedStream;
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
      if (audioManager) {
        audioManager.connectToPiP = undefined;
        audioManager.connectAllToPiP = undefined;
      }
    };
  }, [isVisible, activeSounds]);

  // Handle Picture-in-Picture mode
  const enterPiPMode = async () => {
    try {
      if (!videoRef.current) return;
      
      // Ensure video is playing (required for PiP)
      await videoRef.current.play();
      
      // Request PiP mode
      await videoRef.current.requestPictureInPicture();
      setIsPiPActive(true);
      
      // Handle exiting PiP
      videoRef.current.addEventListener('leavepictureinpicture', () => {
        setIsPiPActive(false);
      });
    } catch (error) {
      console.error('Failed to enter PiP mode:', error);
    }
  };

  // Don't render if not visible or PiP not supported
  if (!isVisible || !isPiPSupported) return null;

  return (
    <div className="fixed bottom-20 right-4 z-50">
      <div className="bg-black rounded-lg overflow-hidden shadow-xl w-64">
        <canvas 
          ref={canvasRef} 
          className="w-full h-auto"
          style={{ display: 'block' }}
        />
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted={false}
          style={{ display: 'none' }}
        />
        <div className="absolute bottom-2 right-2">
          <IconButton 
            icon={TbPictureInPicture} 
            onClick={enterPiPMode} 
            variant="secondary"
            tooltip="Open Picture-in-Picture"
            disabled={isPiPActive}
          />
        </div>
      </div>
    </div>
  );
} 