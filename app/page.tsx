'use client';

import { useState, useEffect } from 'react';
import SoundEqualizer from './components/SoundEqualizer';
import ForestMatch from './components/ForestMatch';
import { findMatchingForest, SoundProfile, SoundType } from './utils/forestMatcher';
import { Forest, forests } from './data/forests';
import Image from 'next/image';

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

  const handleSoundChange = (sounds: SoundProfile) => {
    // Set hasInteracted to true on first interaction
    if (!hasInteracted) {
      setHasInteracted(true);
    }

    // Update active sounds based on non-zero values
    const newActiveSounds = new Set<SoundType>();
    Object.entries(sounds).forEach(([sound, value]) => {
      if (value > 0) {
        newActiveSounds.add(sound as SoundType);
      }
    });
    setActiveSounds(newActiveSounds);

    // Only find matching forest if there are active sounds
    if (newActiveSounds.size > 0) {
      const matchingForest = findMatchingForest(sounds, newActiveSounds);
      setCurrentForest(matchingForest);
    } else {
      setCurrentForest(null);
    }
  };

  return (
    <main className="flex-1 relative h-screen overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 transition-opacity duration-1000">
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
      <div className="relative z-10 h-screen flex flex-col">
        {/* Forest Match */}
        <div className="flex-1 flex items-center justify-center p-4 min-h-[30vh]">
          <ForestMatch forest={currentForest} />
        </div>

        {/* Sound Equalizer */}
        <div className="w-full -mt-[10vh] md:mt-0">
          <SoundEqualizer onSoundChange={handleSoundChange} />
        </div>
      </div>
    </main>
  );
}
