'use client';

import { useState, useEffect, useRef } from 'react';
import SoundEqualizer from './components/SoundEqualizer';
import ForestMatch from './components/ForestMatch';
import PiPMiniPlayer, { PiPMiniPlayerHandle } from './components/PiPMiniPlayer';
import SpotifyIntegration from './components/SpotifyIntegration';
import { findMatchingForest, SoundProfile, SoundType } from './utils/forestMatcher';
import { Forest, forests } from './data/forests';
import Image from 'next/image';
import { TbWind, TbDroplet, TbFeather, TbCloudStorm, TbDropletFilled, TbBug, TbDeer, TbFlame, TbMoodSmile, TbPray, TbPictureInPicture, TbPictureInPictureOff, TbBrandSpotify } from 'react-icons/tb';
import { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET } from './utils/env';

const soundIcons = {
  wind: TbWind,
  rain: TbDroplet,
  birds: TbFeather,
  thunder: TbCloudStorm,
  water: TbDropletFilled,
  insects: TbBug,
  mammals: TbDeer,
  fire: TbFlame,
  ambient: TbMoodSmile,
  spiritual: TbPray
} as const;

const soundLabels: Record<SoundType, string> = {
  wind: 'Wind',
  rain: 'Rain',
  birds: 'Birds',
  thunder: 'Thunder',
  water: 'Water',
  insects: 'Insects',
  mammals: 'Mammals',
  fire: 'Fire',
  ambient: 'Ambient',
  spiritual: 'Spiritual'
};

export default function Home() {
  const [currentForest, setCurrentForest] = useState<Forest | null>(null);
  const [activeSounds, setActiveSounds] = useState<Set<SoundType>>(new Set());
  const [hasInteracted, setHasInteracted] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [previousImage, setPreviousImage] = useState<string>('/assets/images/forest1.png');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [nextImageLoaded, setNextImageLoaded] = useState(false);
  const [isPiPVisible, setIsPiPVisible] = useState(false);
  const pipPlayerRef = useRef<PiPMiniPlayerHandle>(null);
  const [soundLevels, setSoundLevels] = useState<Record<SoundType, number>>({} as Record<SoundType, number>);
  const [isSpotifyVisible, setIsSpotifyVisible] = useState(false);

  // Preload forest images
  useEffect(() => {
    const preloadImages = async () => {
      const imagePromises = forests.map((forest: Forest) => {
        return new Promise((resolve, reject) => {
          const img = new window.Image();
          img.src = forest.imageUrl;
          img.onload = resolve;
          img.onerror = reject;
        });
      });

      try {
        await Promise.all(imagePromises);
        setImagesLoaded(true);
      } catch (error) {
        console.error('Failed to preload images:', error);
      }
    };

    preloadImages();
  }, []);

  // Handle next image loading
  useEffect(() => {
    if (currentForest?.imageUrl) {
      const img = new window.Image();
      img.src = currentForest.imageUrl;
      img.onload = () => {
        setNextImageLoaded(true);
        // Start transition only after image is loaded
        setIsTransitioning(true);
        setTimeout(() => {
          setIsTransitioning(false);
          // Update previous image to match current after transition
          setPreviousImage(currentForest.imageUrl);
        }, 1000);
      };
    }
  }, [currentForest?.imageUrl]);

  const handleSoundChange = (activeSounds: SoundType[], levels?: Record<SoundType, number>) => {
    console.log('Page Sound Change:', {
      activeSounds,
      hasInteracted,
      currentForest,
      levels
    });

    // Set hasInteracted to true on first interaction
    if (!hasInteracted) {
      setHasInteracted(true);
      console.log('First interaction detected');
    }

    // Update active sounds
    setActiveSounds(new Set(activeSounds));
    
    // Update sound levels if provided
    if (levels) {
      setSoundLevels(levels);
    }

    // Create a sound profile from the active sounds
    const soundProfile: SoundProfile = {} as SoundProfile;
    Object.keys(soundIcons).forEach((sound) => {
      // Use 0.5 for active sounds to match the initial value when toggling
      soundProfile[sound as SoundType] = activeSounds.includes(sound as SoundType) ? 0.5 : 0;
    });

    console.log('Sound Profile:', soundProfile);

    // Only find matching forest if there are active sounds
    if (activeSounds.length > 0) {
      const matchingForest = findMatchingForest(soundProfile, new Set(activeSounds));
      console.log('Matching Forest:', matchingForest);
      
      if (matchingForest && (!currentForest || currentForest.id !== matchingForest.id)) {
        // Store current image as previous
        setPreviousImage(currentForest?.imageUrl || '/assets/images/forest1.png');
        // Reset transition state
        setNextImageLoaded(false);
        setIsTransitioning(false);
        // Update forest (this will trigger the image loading effect)
        setCurrentForest(matchingForest);
      }
    } else {
      console.log('No active sounds, clearing forest');
      // Store current image as previous
      setPreviousImage(currentForest?.imageUrl || '/assets/images/forest1.png');
      // Reset transition state
      setNextImageLoaded(false);
      setIsTransitioning(false);
      // Clear forest (this will trigger the image loading effect)
      setCurrentForest(null);
    }
  };

  // Toggle PiP visibility
  const togglePiP = () => {
    // If currently visible and about to be hidden, need to ensure audio cleanup
    if (isPiPVisible) {
      console.log('Hiding PiP via toggle button - ensuring audio cleanup');
      
      // First try to use the direct ref method (most reliable)
      if (pipPlayerRef.current) {
        console.log('Calling direct cleanup method via ref');
        pipPlayerRef.current.cleanupAudio();
      }
      
      // Then set state to hide component
      setIsPiPVisible(false);
      
      // Finally, as a fallback, import audioManager for direct access
      // (this will handle cleanup even if component is already unmounted)
      import('./utils/audioManager').then(({ audioManager }) => {
        // Make sure we clean up audio connections when toggling off
        if (audioManager) {
          console.log('Toggle button: Restoring main page audio via fallback');
          // Reset PiP connections
          audioManager.connectToPiP = undefined;
          // Unmute main page
          if (typeof audioManager.setMainPageMasterGain === 'function') {
            audioManager.setMainPageMasterGain(null);
          }
          // Full cleanup
          if (typeof audioManager.clearPiPConnections === 'function') {
            audioManager.clearPiPConnections();
          }
        }
      });
    } else {
      // Just show the miniplayer if currently hidden
      setIsPiPVisible(true);
    }
  };

  // Handle PiP mini player being closed
  const handlePiPClose = () => {
    console.log('PiP mini player closed by user');
    setIsPiPVisible(false);
  };

  return (
    <main className="h-screen overflow-hidden relative">
      {/* Background image with transition - fixed to viewport */}
      <div className="fixed inset-0 z-0">
        {/* Previous image */}
        <div 
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            isTransitioning ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <Image
            src={previousImage}
            alt="Previous Forest"
            fill
            priority
            className="object-cover"
            sizes="100vw"
            quality={90}
          />
        </div>
        {/* Current image */}
        <div 
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            isTransitioning && nextImageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <Image
            src={currentForest?.imageUrl || '/assets/images/forest1.png'}
            alt={currentForest?.name || 'Default Forest'}
            fill
            priority
            className="object-cover"
            sizes="100vw"
            quality={90}
          />
        </div>
        
        {/* Overlay gradient for better text contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/10 to-black/50"></div>
      </div>

      {/* Content - fixed height */}
      <div className="relative h-full flex flex-col z-10">
        {/* Fixed header with app title and controls */}
        <div className="w-full flex justify-between items-center py-3 px-4 z-20 bg-gradient-to-b from-black/30 to-transparent">
          {/* App Title */}
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight 
                          bg-gradient-to-b from-gray-200/40 to-gray-300/40 
                          border border-gray-400/20
                          backdrop-filter backdrop-blur-[2px]
                          shadow-[0_2px_10px_rgba(0,0,0,0.08),inset_0_1px_1px_rgba(255,255,255,0.3)]
                          px-4 py-2 rounded-xl text-gray-800">
              forest<span className="text-orange-500">maker</span>
            </h1>
          </div>

          {/* Control Buttons */}
          <div className="flex flex-row items-center space-x-2">
            {/* Spotify Button */}
            <button
              onClick={() => setIsSpotifyVisible(!isSpotifyVisible)}
              className="bg-gradient-to-b from-gray-200/40 to-gray-300/40 
                       border border-gray-400/20
                       backdrop-filter backdrop-blur-[2px]
                       shadow-[0_2px_10px_rgba(0,0,0,0.08),inset_0_1px_1px_rgba(255,255,255,0.3)]
                       hover:shadow-md active:shadow-inner
                       text-gray-700 p-2.5 rounded-xl transition-all duration-200"
              aria-label={isSpotifyVisible ? "Hide Spotify" : "Show Spotify"}
              title={isSpotifyVisible ? "Hide Spotify" : "Show Spotify"}
            >
              <TbBrandSpotify size={20} className={isSpotifyVisible ? "text-green-600" : "text-gray-700"} />
            </button>
            
            {/* PiP Toggle Button */}
            <div className="flex flex-row items-center">
              <span className="hidden sm:inline-block text-gray-800 text-xs font-medium 
                             bg-gradient-to-b from-gray-200/40 to-gray-300/40 
                             border border-gray-400/20 border-r-0
                             backdrop-filter backdrop-blur-[2px]
                             shadow-[0_2px_10px_rgba(0,0,0,0.08),inset_0_1px_1px_rgba(255,255,255,0.3)]
                             px-3 py-1.5 rounded-l-xl whitespace-nowrap">
                Play in background
              </span>
              <button
                onClick={togglePiP}
                className="bg-gradient-to-b from-gray-200/40 to-gray-300/40 
                         border border-gray-400/20 sm:border-l-0
                         backdrop-filter backdrop-blur-[2px]
                         shadow-[0_2px_10px_rgba(0,0,0,0.08),inset_0_1px_1px_rgba(255,255,255,0.3)]
                         hover:shadow-md active:shadow-inner
                         text-gray-700 p-2.5 rounded-xl sm:rounded-l-none transition-all duration-200"
                aria-label={isPiPVisible ? "Hide Picture-in-Picture" : "Show Picture-in-Picture"}
                title={isPiPVisible ? "Hide Picture-in-Picture" : "Show Picture-in-Picture"}
              >
                {isPiPVisible ? <TbPictureInPictureOff size={20} /> : <TbPictureInPicture size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Top section with forest info - compact */}
        <div className="py-2 px-4">
          <ForestMatch forest={currentForest} />
        </div>

        {/* Spotify Integration (Floating Panel) */}
        <div className={`fixed top-20 right-4 z-30 w-80 transform transition-all duration-300 shadow-xl ${
          isSpotifyVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
        }`}>
          <div className="relative">
            {/* Tab handle for closed state */}
            <button 
              onClick={() => setIsSpotifyVisible(true)} 
              className={`absolute left-0 top-10 transform -translate-x-full 
                        bg-gradient-to-b from-green-500/70 to-green-600/60 
                        border border-green-500/30
                        backdrop-filter backdrop-blur-[2px]
                        shadow-[0_2px_10px_rgba(0,0,0,0.08),inset_0_1px_1px_rgba(255,255,255,0.3)]
                        text-white py-2 px-3 rounded-l-lg flex items-center ${
                isSpotifyVisible ? 'opacity-0 pointer-events-none' : 'opacity-100'
              }`}
              aria-label="Open Spotify controls"
            >
              <TbBrandSpotify size={18} className="mr-2" />
              <span className="text-sm">Spotify</span>
            </button>
            
            <SpotifyIntegration 
              clientId={SPOTIFY_CLIENT_ID} 
              clientSecret={SPOTIFY_CLIENT_SECRET}
              isVisible={isSpotifyVisible} 
            />
          </div>
        </div>

        {/* Sound Equalizer - main content area with fixed height */}
        <div className="flex-1 h-full overflow-visible px-2 pt-3 md:pt-4">
          <SoundEqualizer 
            onSoundChange={(sounds: SoundType[], levels?: Record<SoundType, number>) => 
              handleSoundChange(sounds, levels)
            } 
          />
        </div>
        
        {/* PiP Mini Player */}
        <PiPMiniPlayer 
          ref={pipPlayerRef}
          forest={currentForest} 
          activeSounds={activeSounds} 
          isVisible={isPiPVisible}
          onClose={handlePiPClose}
        />
      </div>
    </main>
  );
}
