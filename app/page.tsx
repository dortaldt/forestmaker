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
