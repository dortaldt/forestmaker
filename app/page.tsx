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

// Get device frame background color based on forest theme
const getDeviceFrameStyle = (forestId?: string) => {
  if (!forestId) return {
    outer: 'bg-gradient-to-b from-gray-200 to-gray-300 border-gray-300',
    inner: 'from-gray-50 to-gray-100'
  };
  
  const themeColors: Record<string, {outer: string, inner: string}> = {
    'amazon': {
      outer: 'bg-gradient-to-b from-green-400 to-green-600 border-green-500',
      inner: 'from-green-50 to-green-100'
    },
    'black-forest': {
      outer: 'bg-gradient-to-b from-gray-600 to-gray-800 border-gray-700',
      inner: 'from-gray-100 to-gray-200'
    },
    'redwood': {
      outer: 'bg-gradient-to-b from-red-400 to-red-600 border-red-500',
      inner: 'from-red-50 to-red-100'
    },
    'boreal': {
      outer: 'bg-gradient-to-b from-blue-400 to-blue-600 border-blue-500',
      inner: 'from-blue-50 to-blue-100'
    },
    'taiga': {
      outer: 'bg-gradient-to-b from-teal-400 to-teal-600 border-teal-500',
      inner: 'from-teal-50 to-teal-100'
    },
    'sundarbans': {
      outer: 'bg-gradient-to-b from-emerald-400 to-emerald-600 border-emerald-500',
      inner: 'from-emerald-50 to-emerald-100'
    },
    'aokigahara': {
      outer: 'bg-gradient-to-b from-purple-400 to-purple-600 border-purple-500',
      inner: 'from-purple-50 to-purple-100'
    },
    'tongass': {
      outer: 'bg-gradient-to-b from-cyan-400 to-cyan-600 border-cyan-500',
      inner: 'from-cyan-50 to-cyan-100'
    },
    'jiuzhaigou': {
      outer: 'bg-gradient-to-b from-orange-400 to-orange-600 border-orange-500',
      inner: 'from-orange-50 to-orange-100'
    },
    'crooked': {
      outer: 'bg-gradient-to-b from-violet-400 to-violet-600 border-violet-500',
      inner: 'from-violet-50 to-violet-100'
    },
    'drakensberg': {
      outer: 'bg-gradient-to-b from-amber-400 to-amber-600 border-amber-500',
      inner: 'from-amber-50 to-amber-100'
    },
    'valdivian': {
      outer: 'bg-gradient-to-b from-lime-400 to-lime-600 border-lime-500',
      inner: 'from-lime-50 to-lime-100'
    },
    'sinharaja': {
      outer: 'bg-gradient-to-b from-emerald-400 to-emerald-600 border-emerald-500',
      inner: 'from-emerald-50 to-emerald-100'
    },
    'białowieża': {
      outer: 'bg-gradient-to-b from-green-500 to-green-700 border-green-600',
      inner: 'from-green-50 to-green-100'
    },
    'hoh': {
      outer: 'bg-gradient-to-b from-teal-400 to-teal-600 border-teal-500',
      inner: 'from-teal-50 to-teal-100'
    },
    'daintree': {
      outer: 'bg-gradient-to-b from-green-400 to-green-600 border-green-500',
      inner: 'from-green-50 to-green-100'
    },
    'congo': {
      outer: 'bg-gradient-to-b from-yellow-500 to-yellow-700 border-yellow-600',
      inner: 'from-yellow-50 to-yellow-100'
    },
    'great-bear': {
      outer: 'bg-gradient-to-b from-blue-500 to-blue-700 border-blue-600',
      inner: 'from-blue-50 to-blue-100'
    },
    'yakushima': {
      outer: 'bg-gradient-to-b from-emerald-400 to-emerald-600 border-emerald-500',
      inner: 'from-emerald-50 to-emerald-100'
    },
  };
  
  return themeColors[forestId] || {
    outer: 'bg-gradient-to-b from-gray-200 to-gray-300 border-gray-300',
    inner: 'from-gray-50 to-gray-100'
  };
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

      {/* Device Container - New skeuomorphic container */}
      <div className="relative h-full flex flex-col items-center justify-center z-10">
        <div className="device-container w-full sm:max-w-md h-full sm:h-auto mx-auto my-auto">
          {/* Device Frame - now themed based on forest */}
          <div className={`device-frame rounded-3xl sm:rounded-3xl overflow-hidden shadow-xl pt-3 pb-3
                         ${getDeviceFrameStyle(currentForest?.id).outer}
                         h-full sm:h-auto border-2 transition-colors duration-700 relative
                         flex flex-col shadow-[0_6px_20px_rgba(0,0,0,0.15),inset_0_1px_3px_rgba(255,255,255,0.6)]`}>
            
            {/* Plastic shine effect */}
            <div className="absolute inset-0 z-0 pointer-events-none">
              <div className="absolute inset-x-0 top-0 h-[15%] bg-gradient-to-b from-white/40 to-transparent"></div>
              <div className="absolute left-0 right-0 top-[15%] h-[10%] bg-gradient-to-b from-transparent via-white/5 to-transparent"></div>
              <div className="absolute right-0 bottom-[40%] w-[10%] h-[40%] bg-gradient-to-l from-white/30 to-transparent"></div>
              <div className="absolute left-[5%] top-[30%] w-[15%] h-[5%] bg-radial-gradient rounded-full opacity-20"></div>
            </div>
            
            {/* Device Screen - Enhanced skeuomorphic design */}
            <div className="device-screen relative rounded-xl overflow-hidden mx-4 mb-4 z-10
                         flex-grow sm:flex-grow-0 sm:h-56 border-[3px] border-gray-400/30
                         shadow-[inset_0_0_10px_rgba(0,0,0,0.2),0_2px_3px_rgba(0,0,0,0.1)]">
              {/* Screen content - forest image */}
              <div className="absolute inset-0">
                <Image
                  src={currentForest?.imageUrl || '/assets/images/forest1.png'}
                  alt={currentForest?.name || 'Default Forest'}
                  fill
                  priority
                  className="object-cover"
                  sizes="100vw"
                  quality={90}
                />
                {/* Screen glare effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/5 pointer-events-none"></div>
              </div>
              
              {/* Screen texture - subtle scanlines and noise */}
              <div className="screen-texture absolute inset-0 pointer-events-none
                           bg-[linear-gradient(transparent_50%,rgba(0,0,0,.02)_50%)] bg-[length:100%_2px]"></div>
              
              {/* Screen inner shadow */}
              <div className="screen-inner-shadow absolute inset-0 pointer-events-none
                           shadow-[inset_0_0_15px_rgba(0,0,0,0.3),inset_0_0_3px_rgba(0,0,0,0.5)]"></div>
              
              {/* Forest information overlay - Integrated ForestMatch here */}
              {currentForest ? (
                <div className="absolute inset-0 flex flex-col justify-between">
                  {/* Top area for forest info */}
                  <div className="p-3 bg-gradient-to-b from-black/40 to-transparent">
                    <ForestMatch forest={currentForest} />
                  </div>
                  {/* Bottom area for forest name */}
                  <div className="p-2 bg-gradient-to-t from-black/70 to-transparent">
                    <h2 className="text-sm font-semibold text-white tracking-wide"
                       style={{ textShadow: '0 1px 2px rgba(0,0,0,0.7)' }}>
                      {currentForest.name}
                    </h2>
                  </div>
                </div>
              ) : (
                hasInteracted && imagesLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="backdrop-blur-[2px] rounded-xl px-4 py-3 max-w-xs
                               bg-gradient-to-b from-gray-200/40 to-gray-300/40 
                               border border-gray-400/20
                               shadow-[0_2px_10px_rgba(0,0,0,0.08),inset_0_1px_1px_rgba(255,255,255,0.3)]">
                      <h2 className="text-lg font-bold mb-1 text-gray-800">Welcome to Forest Maker</h2>
                      <p className="text-xs text-gray-700">
                        Adjust the sliders below to create your perfect forest atmosphere
                      </p>
                    </div>
                  </div>
                )
              )}
            </div>
            
            {/* Controls Panel */}
            <div className={`equalizer-container relative z-10 mt-0 sm:mt-4 mb-auto sm:mb-0 pt-3 pb-4 px-4 rounded-xl mx-4
                          bg-gradient-to-b ${getDeviceFrameStyle(currentForest?.id).inner} to-white/90
                          border border-white/40 
                          shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_1px_3px_rgba(0,0,0,0.1)]
                          transition-colors duration-700`}>
              {/* Fixed header with app title and controls */}
              <div className="w-full flex justify-between items-center pb-2 mb-1 z-20 border-b border-gray-200/50">
                {/* App Title */}
                <div>
                  <h1 className="text-sm font-bold tracking-tight engraved-text">
                    forest<span className="text-orange-500">maker</span>
                  </h1>
                </div>
                
                {/* Control buttons */}
                <div className="flex space-x-2">
                  <button
                    onClick={togglePiP}
                    className="mode-button p-1 rounded-full"
                    aria-label={isPiPVisible ? "Close PiP mode" : "Open PiP mode"}
                  >
                    {isPiPVisible ? <TbPictureInPictureOff size={18} className="text-gray-700" /> : <TbPictureInPicture size={18} className="text-gray-700" />}
                  </button>
                  
                  <button
                    onClick={() => setIsSpotifyVisible(!isSpotifyVisible)}
                    className={`mode-button p-1 rounded-full ${isSpotifyVisible ? 'active' : ''}`}
                    aria-label={isSpotifyVisible ? "Hide Spotify" : "Show Spotify"}
                  >
                    <TbBrandSpotify className={isSpotifyVisible ? 'text-green-700' : 'text-gray-700'} size={18} />
                  </button>
                </div>
              </div>
              
              {/* Sound Equalizer */}
              <SoundEqualizer onSoundChange={handleSoundChange} />
              
              {/* Mode buttons - simpler layout */}
              <div className="flex justify-center mt-4 space-x-3">
                <button className="mode-button active text-xs font-medium px-4 py-1 rounded-full engraved-text">Fast</button>
                <button className="mode-button text-xs font-medium px-4 py-1 rounded-full text-gray-500 engraved-text">Slow</button>
                <button className="mode-button text-xs font-medium px-4 py-1 rounded-full text-gray-500 engraved-text">Auto</button>
              </div>
            </div>
          </div>
        </div>
        
        {/* PiP mini player */}
        {isPiPVisible && (
          <PiPMiniPlayer
            ref={pipPlayerRef}
            onClose={handlePiPClose}
            forest={currentForest}
            activeSounds={new Set<string>(Array.from(activeSounds))}
            isVisible={isPiPVisible}
          />
        )}
        
        {/* Spotify Integration */}
        {isSpotifyVisible && (
          <div className="absolute bottom-4 left-0 right-0 z-20 px-4">
            <div className="device-frame p-3 rounded-xl mx-auto max-w-md">
              <SpotifyIntegration 
                clientId={SPOTIFY_CLIENT_ID} 
                clientSecret={SPOTIFY_CLIENT_SECRET}
                isVisible={isSpotifyVisible} 
              />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
