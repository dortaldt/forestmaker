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
import { extractAverageColor, getDarkerColor, getLighterColor } from './utils/colorExtractor';

// Helper for smooth color transitions
const interpolateColor = (color1: string, color2: string, factor: number = 0.5): string => {
  // Remove the # if present
  color1 = color1.replace('#', '');
  color2 = color2.replace('#', '');
  
  // Parse the colors
  const r1 = parseInt(color1.substring(0, 2), 16);
  const g1 = parseInt(color1.substring(2, 4), 16);
  const b1 = parseInt(color1.substring(4, 6), 16);
  
  const r2 = parseInt(color2.substring(0, 2), 16);
  const g2 = parseInt(color2.substring(2, 4), 16);
  const b2 = parseInt(color2.substring(4, 6), 16);
  
  // Interpolate
  const r = Math.round(r1 + factor * (r2 - r1));
  const g = Math.round(g1 + factor * (g2 - g1));
  const b = Math.round(b1 + factor * (b2 - b1));
  
  // Convert back to hex
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

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
  const [imageAverageColor, setImageAverageColor] = useState<string>('#808080');
  const [previousColor, setPreviousColor] = useState<string>('#808080');
  const [displayColor, setDisplayColor] = useState<string>('#808080');
  const [textAnimationKey, setTextAnimationKey] = useState(0);

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
        // Reset text animation key to trigger fresh animations
        setTextAnimationKey(prev => prev + 1);
        setTimeout(() => {
          setIsTransitioning(false);
          // Update previous image to match current after transition
          setPreviousImage(currentForest.imageUrl);
        }, 2200); // Extended for smoother transition
      };
    }
  }, [currentForest?.imageUrl]);

  // Extract average color from the forest image when it changes
  useEffect(() => {
    if (currentForest?.imageUrl) {
      extractAverageColor(currentForest.imageUrl)
        .then((color: string) => {
          console.log(`Extracted color for ${currentForest.name}: ${color}`);
          setImageAverageColor(color);
        })
        .catch((error: Error) => {
          console.error('Failed to extract color:', error);
        });
    }
  }, [currentForest?.imageUrl]);

  // Handle smooth color transitions
  useEffect(() => {
    if (isTransitioning) {
      // When transitioning starts, store current color
      setPreviousColor(displayColor);
    } else {
      // When transition completes, update to new color
      setDisplayColor(imageAverageColor);
    }
  }, [isTransitioning, imageAverageColor, displayColor]);

  // Animate color transitions
  useEffect(() => {
    let animationFrame: number;
    let startTime: number | null = null;
    const duration = 2000; // Match duration with other transitions

    const animateColor = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Use easing function for smoother transition
      const easedProgress = 1 - Math.pow(1 - progress, 3); // Cubic ease out
      
      if (progress < 1) {
        // Interpolate between previous and new color
        const interpolated = interpolateColor(previousColor, imageAverageColor, easedProgress);
        setDisplayColor(interpolated);
        animationFrame = requestAnimationFrame(animateColor);
      } else {
        setDisplayColor(imageAverageColor);
      }
    };

    if (isTransitioning && previousColor !== imageAverageColor) {
      animationFrame = requestAnimationFrame(animateColor);
    }

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [isTransitioning, previousColor, imageAverageColor]);

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
        {/* Previous image - with smoother zoom out effect */}
        <div 
          className={`absolute inset-0 transition-all duration-2500 ease-out-expo will-change-all ${
            isTransitioning ? 'opacity-0 scale-[1.04] blur-[2px]' : 'opacity-100 scale-100 blur-0'
          }`}
          style={{ 
            animationName: isTransitioning ? 'cross-fade-out' : 'none',
            animationDuration: '2500ms',
            animationFillMode: 'forwards',
            animationTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          <Image
            src={previousImage}
            alt="Previous Forest"
            fill
            priority
            className="object-cover"
            sizes="100vw"
            quality={95}
          />
        </div>
        {/* Current image - with smoother zoom in effect */}
        <div 
          className={`absolute inset-0 transition-all duration-3000 ease-out-expo will-change-all ${
            isTransitioning && nextImageLoaded ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-[1.1] blur-[3px]'
          }`}
          style={{ 
            animationName: isTransitioning && nextImageLoaded ? 'cross-fade-in' : 'none',
            animationDuration: '3000ms',
            animationFillMode: 'forwards',
            animationTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          <Image
            src={currentForest?.imageUrl || '/assets/images/forest1.png'}
            alt={currentForest?.name || 'Default Forest'}
            fill
            priority
            className="object-cover"
            sizes="100vw"
            quality={95}
          />
        </div>
        
        {/* Overlay gradient with improved transition */}
        <div 
          className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/10 to-black/50 transition-all duration-2000 ease-out-expo"
          style={{ 
            opacity: isTransitioning ? 0.4 : 1,
            filter: `saturate(${isTransitioning ? 1.2 : 1})`,
            backdropFilter: `blur(${isTransitioning ? '1px' : '0px'})`
          }}
        ></div>
      </div>

      {/* Device Container - with improved transition */}
      <div className="relative h-full flex flex-col items-center justify-center z-10">
        <div 
          className="device-container w-full sm:max-w-md md:max-w-lg h-full sm:h-auto mx-auto my-auto transition-all duration-2000 ease-out-expo"
          style={{ 
            filter: `drop-shadow(0 0 20px ${displayColor}60)`,
            transform: isTransitioning ? 'scale(0.98)' : 'scale(1)'
          }}
        >
          {/* Device Frame - now themed based on forest */}
          <div 
            className={`device-frame rounded-3xl sm:rounded-3xl overflow-hidden shadow-xl pt-3 pb-3
                     h-full sm:h-auto border-2 transition-colors duration-700 relative
                     flex flex-col shadow-[0_6px_20px_rgba(0,0,0,0.15),inset_0_1px_3px_rgba(255,255,255,0.6)]`}
            style={{
              background: `linear-gradient(to bottom, ${displayColor}, ${getDarkerColor(displayColor, 0.4)})`,
              borderColor: getDarkerColor(displayColor, 0.15),
              borderWidth: '2px',
              transition: 'background 2s ease-out, border-color 2s ease-out, box-shadow 2s ease-out'
            }}
          >
            
            {/* Plastic shine effect - enhanced to better show the color */}
            <div className="absolute inset-0 z-0 pointer-events-none">
              <div className="absolute inset-x-0 top-0 h-[15%] bg-gradient-to-b from-white/30 to-transparent"></div>
              <div className="absolute left-0 right-0 top-[15%] h-[10%] bg-gradient-to-b from-transparent via-white/5 to-transparent"></div>
              <div className="absolute right-0 bottom-[40%] w-[10%] h-[40%] bg-gradient-to-l from-white/20 to-transparent"></div>
              <div className="absolute left-[5%] top-[30%] w-[15%] h-[5%] bg-radial-gradient rounded-full opacity-20"></div>
            </div>
            
            {/* Device Screen - Enhanced skeuomorphic design with theme colors */}
            <div className="device-screen relative rounded-xl overflow-hidden mx-4 mb-4 z-10
                         flex-grow sm:flex-grow-0 sm:h-56 md:h-64 lg:h-72
                         shadow-[inset_0_0_10px_rgba(0,0,0,0.2),0_2px_3px_rgba(0,0,0,0.1)]"
                style={{
                  border: `3px solid ${getDarkerColor(displayColor, 0.25)}50`,
                  boxShadow: `inset 0 0 10px rgba(0,0,0,0.2), 0 2px 5px ${getDarkerColor(displayColor, 0.2)}50`
                }}
            >
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
              
              {/* Screen inner shadow with theme color */}
              <div className="screen-inner-shadow absolute inset-0 pointer-events-none"
                   style={{
                     boxShadow: `inset 0 0 15px rgba(0,0,0,0.3), 
                                inset 0 0 3px rgba(0,0,0,0.5), 
                                inset 0 0 20px ${getDarkerColor(displayColor, 0.2)}30`
                   }}
              ></div>
              
              {/* Forest information overlay - Integrated ForestMatch here */}
              {currentForest ? (
                <div className="absolute inset-0 flex flex-col justify-between">
                  {/* Top area for forest info - animate with delay */}
                  <div 
                    className="p-3 bg-gradient-to-b from-black/40 to-transparent transition-opacity duration-700 ease-out"
                    style={{ 
                      opacity: isTransitioning ? 0 : 1,
                      transitionDelay: '300ms'
                    }}
                  >
                    <ForestMatch forest={currentForest} />
                  </div>
                  
                  {/* Album cover style forest name - large dramatic typography */}
                  <div className="flex flex-col justify-end h-full overflow-hidden">
                    {/* Dark gradient overlay for better text visibility */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none"></div>
                    
                    {/* Subtle noise texture overlay using CSS */}
                    <div 
                      className="absolute inset-0 opacity-5 mix-blend-overlay pointer-events-none"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                        backgroundRepeat: 'repeat',
                        backgroundSize: '100px 100px'
                      }}
                    ></div>
                    
                    {/* Left accent bar - animated */}
                    <div 
                      className="absolute left-0 top-1/4 bottom-0 w-1.5 rounded-r-full opacity-60 transition-transform duration-700 ease-out-expo" 
                      style={{ 
                        background: `linear-gradient(to bottom, transparent, ${displayColor})`,
                        transform: isTransitioning ? 'translateX(-100%)' : 'translateX(0)',
                        transitionDelay: '200ms'
                      }}
                    ></div>
                    
                    {/* Right accent bar - animated */}
                    <div 
                      className="absolute right-0 top-1/2 bottom-0 w-1.5 rounded-l-full opacity-60 transition-transform duration-700 ease-out-expo" 
                      style={{ 
                        background: `linear-gradient(to bottom, transparent, ${displayColor})`,
                        transform: isTransitioning ? 'translateX(100%)' : 'translateX(0)',
                        transitionDelay: '250ms'
                      }}
                    ></div>
                    
                    {/* Content container with staggered animations - now with EXIT animations too */}
                    <div className="relative z-10 px-5 pb-6 pt-10 text-center" key={textAnimationKey}>
                      {/* Album-style top label - animated with exit */}
                      <div 
                        className="mb-3 flex items-center justify-center transition-all duration-700 ease-out-expo" 
                        style={{ 
                          opacity: isTransitioning ? 0 : 1, 
                          transform: isTransitioning ? 'translateY(-8px)' : 'translateY(0)',
                          transitionDelay: isTransitioning ? '0ms' : '100ms',
                          pointerEvents: isTransitioning ? 'none' : 'auto'
                        }}
                      >
                        <div className="h-px w-6 bg-white/30 transition-all duration-500" style={{ width: isTransitioning ? '0' : '1.5rem' }}></div>
                        <span className="mx-2 text-[10px] font-medium tracking-widest text-white/50 uppercase">Forestmaker</span>
                        <div className="h-px w-6 bg-white/30 transition-all duration-500" style={{ width: isTransitioning ? '0' : '1.5rem' }}></div>
                      </div>
                      
                      {/* Decorative line - animated with exit */}
                      <div 
                        className="w-20 h-[2px] bg-white/60 mx-auto mb-4 transition-all duration-700 ease-out-expo" 
                        style={{ 
                          opacity: isTransitioning ? 0 : 1,
                          width: isTransitioning ? '0' : '5rem',
                          transitionDelay: isTransitioning ? '50ms' : '200ms'
                        }}
                      ></div>
                      
                      {/* Album-style title with dramatic typography - animated with exit */}
                      <h2 
                        className="text-[2rem] sm:text-[1.8rem] md:text-[2.2rem] font-black uppercase tracking-tight leading-none mb-1 text-white transition-all duration-900 ease-out-expo overflow-hidden will-change-all"
                        style={{ 
                          textShadow: `0 2px 20px rgba(0,0,0,0.5), 0 4px 25px rgba(0,0,0,0.3), 0 0 40px ${displayColor}30`,
                          letterSpacing: '-0.02em',
                          fontWeight: 900,
                          opacity: isTransitioning ? 0 : 1,
                          transform: isTransitioning ? 'translateY(-25px) scale(0.95)' : 'translateY(0) scale(1)',
                          transitionDelay: isTransitioning ? '100ms' : '300ms',
                          filter: `blur(${isTransitioning ? '3px' : '0'})`,
                          maxHeight: isTransitioning ? '0' : '6rem',
                          marginBottom: isTransitioning ? '0' : '0.25rem',
                          animationName: isTransitioning ? 'slide-down' : nextImageLoaded ? 'slide-up' : 'none',
                          animationDuration: '900ms',
                          animationFillMode: 'forwards',
                          animationDelay: isTransitioning ? '100ms' : '300ms',
                          animationTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
                          wordBreak: 'break-word',
                          hyphens: 'auto',
                          lineHeight: '1',
                          display: '-webkit-box',
                          WebkitLineClamp: '2',
                          WebkitBoxOrient: 'vertical'
                        }}
                      >
                        {currentForest.name.split('-').join(' ')}
                      </h2>
                      
                      {/* Subtle subtitle - animated with exit */}
                      <p 
                        className="text-xs uppercase tracking-[0.3em] text-white/70 font-medium mt-3 flex items-center justify-center transition-all duration-700 ease-out-expo" 
                        style={{ 
                          opacity: isTransitioning ? 0 : 1,
                          transform: isTransitioning ? 'translateY(-10px)' : 'translateY(0)',
                          marginTop: isTransitioning ? '0' : '0.75rem',
                          transitionDelay: isTransitioning ? '150ms' : '400ms'
                        }}
                      >
                        <span className="inline-block h-[1px] bg-white/40 mr-3 transition-all duration-700" style={{ width: isTransitioning ? '0' : '0.5rem' }}></span>
                        FOREST EXPERIENCE
                        <span className="inline-block h-[1px] bg-white/40 ml-3 transition-all duration-700" style={{ width: isTransitioning ? '0' : '0.5rem' }}></span>
                      </p>
                      
                      {/* Album release year and edition - animated with exit */}
                      <div 
                        className="flex justify-center items-center space-x-3 mt-1 transition-all duration-700 ease-out-expo" 
                        style={{ 
                          opacity: isTransitioning ? 0 : 1,
                          transform: isTransitioning ? 'translateY(-5px)' : 'translateY(0)',
                          maxHeight: isTransitioning ? '0' : '2rem',
                          marginTop: isTransitioning ? '0' : '0.25rem',
                          transitionDelay: isTransitioning ? '200ms' : '500ms'
                        }}
                      >
                        <span className="text-[10px] font-medium text-white/40">2024</span>
                        <div 
                          className="w-1 h-1 rounded-full transition-all duration-700"
                          style={{ 
                            backgroundColor: displayColor,
                            transform: isTransitioning ? 'scale(0)' : 'scale(1)',
                            transitionDelay: isTransitioning ? '0ms' : '550ms'
                          }}
                        ></div>
                        <span className="text-[10px] font-medium text-white/40">IMMERSIVE EDITION</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                hasInteracted && imagesLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div 
                      className="backdrop-blur-[2px] rounded-xl px-4 py-3 max-w-xs border
                               shadow-[0_2px_10px_rgba(0,0,0,0.08),inset_0_1px_1px_rgba(255,255,255,0.3)]"
                      style={{
                        background: `linear-gradient(to bottom, ${getLighterColor(displayColor, 0.9)}70, ${getLighterColor(displayColor, 0.8)}80)`,
                        borderColor: `${getLighterColor(displayColor, 0.7)}40`,
                      }}
                    >
                      <h2 
                        className="text-lg font-bold mb-1"
                        style={{ color: getDarkerColor(displayColor, 0.3) }}
                      >
                        Welcome to Forest Maker
                      </h2>
                      <p 
                        className="text-xs"
                        style={{ color: getDarkerColor(displayColor, 0.2) }}
                      >
                        Adjust the sliders below to create your perfect forest atmosphere
                      </p>
                    </div>
                  </div>
                )
              )}
            </div>
            
            {/* Controls Panel - more prominent colors */}
            <div 
              className={`equalizer-container relative z-10 mt-0 sm:mt-4 mb-auto sm:mb-0 pt-3 pb-4 px-4 rounded-xl mx-4
                          border shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_1px_3px_rgba(0,0,0,0.1)]
                          transition-colors duration-700`}
              style={{
                background: `linear-gradient(to bottom, ${getLighterColor(displayColor, 0.7)}, ${getLighterColor(displayColor, 0.5)}, ${getLighterColor(displayColor, 0.3)})`,
                borderColor: `${getLighterColor(displayColor, 0.4)}70`,
                borderWidth: '1px'
              }}
            >
              {/* Fixed header with app title and controls */}
              <div className="w-full flex justify-between items-center pb-2 mb-1 z-20 border-b border-gray-200/50">
                {/* App Title */}
                <div>
                  <h1 className="text-sm font-bold tracking-tight engraved-text">
                    forest<span style={{ color: getDarkerColor(displayColor, 0.1) }}>maker</span>
                  </h1>
                </div>
                
                {/* Control buttons */}
                <div className="flex space-x-2">
                  <button
                    onClick={togglePiP}
                    className="mode-button p-1 rounded-full"
                    aria-label={isPiPVisible ? "Close PiP mode" : "Open PiP mode"}
                    style={{ color: getDarkerColor(displayColor, 0.3) }}
                  >
                    {isPiPVisible ? <TbPictureInPictureOff size={18} /> : <TbPictureInPicture size={18} />}
                  </button>
                  
                  <button
                    onClick={() => setIsSpotifyVisible(!isSpotifyVisible)}
                    className={`mode-button p-1 rounded-full ${isSpotifyVisible ? 'active' : ''}`}
                    aria-label={isSpotifyVisible ? "Hide Spotify" : "Show Spotify"}
                  >
                    <TbBrandSpotify className={isSpotifyVisible ? 'text-green-700' : ''} style={!isSpotifyVisible ? { color: getDarkerColor(displayColor, 0.3) } : {}} size={18} />
                  </button>
                </div>
              </div>
              
              {/* Sound Equalizer */}
              <SoundEqualizer onSoundChange={handleSoundChange} />
              
              {/* Mode buttons - themed colors */}
              <div className="flex justify-center mt-4 space-x-3">
                <button 
                  className="mode-button active text-xs font-medium px-4 py-1 rounded-full engraved-text" 
                  style={{ 
                    backgroundColor: getLighterColor(displayColor, 0.8),
                    borderColor: getDarkerColor(displayColor, 0.1),
                    color: getDarkerColor(displayColor, 0.4),
                    boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.6), 0 1px 2px rgba(0,0,0,0.05)'
                  }}
                >
                  Fast
                </button>
                <button 
                  className="mode-button text-xs font-medium px-4 py-1 rounded-full engraved-text" 
                  style={{ color: getDarkerColor(displayColor, 0.2) }}
                >
                  Slow
                </button>
                <button 
                  className="mode-button text-xs font-medium px-4 py-1 rounded-full engraved-text" 
                  style={{ color: getDarkerColor(displayColor, 0.2) }}
                >
                  Auto
                </button>
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
