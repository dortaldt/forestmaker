'use client';

import { useState, useEffect } from 'react';
import SoundEqualizer from './components/SoundEqualizer';
import ForestMatch from './components/ForestMatch';
import { findMatchingForest, SoundProfile, SoundType } from './utils/forestMatcher';
import { Forest, forests } from './data/forests';
import Image from 'next/image';
import { TbWind, TbDroplet, TbFeather, TbCloudStorm, TbDropletFilled, TbBug, TbDeer, TbFlame, TbMoodSmile, TbPray } from 'react-icons/tb';

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

export default function Home() {
  const [currentForest, setCurrentForest] = useState<Forest | null>(null);
  const [activeSounds, setActiveSounds] = useState<Set<SoundType>>(new Set());
  const [hasInteracted, setHasInteracted] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(false);

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

  const handleSoundChange = (activeSounds: SoundType[]) => {
    console.log('Page Sound Change:', {
      activeSounds,
      hasInteracted,
      currentForest
    });

    // Set hasInteracted to true on first interaction
    if (!hasInteracted) {
      setHasInteracted(true);
      console.log('First interaction detected');
    }

    // Update active sounds
    setActiveSounds(new Set(activeSounds));

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
      setCurrentForest(matchingForest);
    } else {
      console.log('No active sounds, clearing forest');
      setCurrentForest(null);
    }
  };

  return (
    <main className="fixed inset-0 overflow-hidden">
      {/* Background Image */}
      <div className="fixed inset-0 transition-opacity duration-1000">
        {activeSounds.size === 0 ? (
          <Image
            src="/assets/images/forest1.png"
            alt="Forest Maker"
            fill
            priority
            className="object-cover"
            sizes="100vw"
            quality={90}
          />
        ) : currentForest ? (
          <Image
            src={currentForest.imageUrl}
            alt={currentForest.name}
            fill
            priority
            className="object-cover"
            sizes="100vw"
            quality={90}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-gray-800" />
        )}
      </div>

      {/* Content */}
      <div className="relative h-full flex flex-col">
        {/* Forest Match - Positioned at top */}
        <div className="flex-none pt-4 md:pt-8 px-4">
          <ForestMatch forest={currentForest} />
        </div>

        {/* Sound Equalizer - Fixed at bottom */}
        <div className="fixed bottom-0 left-0 right-0">
          <div className="w-full py-6">
            <SoundEqualizer onSoundChange={handleSoundChange} />
          </div>
        </div>
      </div>
    </main>
  );
}
