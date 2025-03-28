'use client';

import { useState, useEffect } from 'react';
import SoundEqualizer from './components/SoundEqualizer';
import ForestMatch from './components/ForestMatch';
import { findMatchingForest, SoundProfile, SoundType } from './utils/forestMatcher';
import { Forest } from './data/forests';

export default function Home() {
  const [currentForest, setCurrentForest] = useState<Forest | null>(null);
  const [activeSounds, setActiveSounds] = useState<Set<SoundType>>(new Set());
  const [hasInteracted, setHasInteracted] = useState(false);

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
    <main className="relative min-h-screen w-full overflow-hidden">
      {/* Background Image with overlay */}
      <div className="fixed inset-0">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-500"
          style={{
            backgroundImage: hasInteracted && currentForest
              ? `url(${currentForest.imageUrl})`
              : 'url(/assets/images/forest1.png)',
          }}
        />
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      </div>
      
      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Forest Info */}
        <div className="flex-1 w-full max-w-4xl mx-auto p-8">
          {!hasInteracted ? (
            <div className="text-center">
              <h1 className="text-4xl font-bold mb-4 text-white/90">Welcome to Forest Maker</h1>
              <p className="text-xl text-white/70">
                Adjust the sliders below to create your perfect forest atmosphere
              </p>
            </div>
          ) : (
            <ForestMatch forest={currentForest} />
          )}
        </div>

        {/* Equalizer */}
        <div className="w-full bg-black/30 backdrop-blur-md">
          <SoundEqualizer onSoundChange={handleSoundChange} />
        </div>
      </div>
    </main>
  );
}
