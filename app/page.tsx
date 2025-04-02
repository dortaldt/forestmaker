'use client';

import { useState, useEffect } from 'react';
import SoundEqualizer from './components/SoundEqualizer';
import ForestMatch from './components/ForestMatch';
import { findMatchingForest, SoundProfile, SoundType } from './utils/forestMatcher';
import { Forest, forests } from './data/forests';
import Image from 'next/image';
import { TbWind, TbDroplet, TbFeather, TbCloudStorm, TbDropletFilled, TbBug, TbDeer, TbFlame, TbMoodSmile, TbPray } from 'react-icons/tb';
import { useDebounce } from './utils/useDebounce';

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

interface Forest {
  id: string;
  name: string;
  location: string;
  description: string;
  imageUrl: string;
  backgroundImage: string;
  vibe: string[];
  soundProfile: SoundProfile;
}

export default function Home() {
  const [currentForest, setCurrentForest] = useState<Forest | null>(null);
  const [activeSounds, setActiveSounds] = useState<Set<SoundType>>(new Set());
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentBackground, setCurrentBackground] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const debouncedSoundChange = useDebounce(activeSounds, 300);

  // Handle forest selection and background changes
  useEffect(() => {
    if (!hasInteracted) return;

    const handleForestChange = async () => {
      if (debouncedSoundChange.size === 0) {
        if (currentForest) {
          setIsTransitioning(true);
          await new Promise(resolve => setTimeout(resolve, 300)); // Wait for fade out
          setCurrentForest(null);
          setCurrentBackground(null);
          setIsTransitioning(false);
        }
        return;
      }

      // Create a sound profile from the active sounds
      const soundProfile: SoundProfile = {} as SoundProfile;
      Object.keys(soundIcons).forEach((sound) => {
        soundProfile[sound as SoundType] = debouncedSoundChange.has(sound as SoundType) ? 0.5 : 0;
      });

      const matchingForest = findMatchingForest(soundProfile, debouncedSoundChange);
      
      // Only update if the forest has changed
      if (matchingForest?.id !== currentForest?.id) {
        setIsTransitioning(true);
        await new Promise(resolve => setTimeout(resolve, 300)); // Wait for fade out
        setCurrentForest(matchingForest);
        setCurrentBackground(matchingForest?.backgroundImage || null);
        setIsTransitioning(false);
      }
    };

    handleForestChange();
  }, [debouncedSoundChange, hasInteracted]);

  // Handle initial loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000); // Show loading state for 2 seconds

    return () => clearTimeout(timer);
  }, []);

  const handleSoundChange = (activeSounds: SoundType[]) => {
    if (!hasInteracted) {
      setHasInteracted(true);
    }
    setActiveSounds(new Set(activeSounds));
  };

  return (
    <main className="relative min-h-screen bg-black">
      {/* Background Image */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-black/50 z-10" />
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin" />
          </div>
        ) : (
          <Image
            src={currentBackground || '/assets/images/forest1.png'}
            alt="Forest background"
            fill
            className={`object-cover transition-opacity duration-300 ${
              isTransitioning ? 'opacity-0' : 'opacity-100'
            }`}
            priority
            sizes="100vw"
            quality={90}
          />
        )}
      </div>

      {/* Content */}
      <div className="relative z-20">
        {/* Forest Match - Positioned at top */}
        <div className="flex-none pt-4 md:pt-8 px-4">
          <ForestMatch 
            currentForest={currentForest} 
            activeSounds={Array.from(activeSounds)}
            hasInteracted={hasInteracted}
          />
        </div>

        {/* Sound Equalizer - Fixed at bottom */}
        <div className="flex-none">
          <SoundEqualizer onSoundChange={handleSoundChange} />
        </div>
      </div>
    </main>
  );
}
