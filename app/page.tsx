'use client';

import { useState } from 'react';
import SoundEqualizer from './components/SoundEqualizer';
import ForestMatch from './components/ForestMatch';
import { findMatchingForest } from './utils/forestMatcher';
import { Forest } from './data/forests';

export default function Home() {
  const [currentForest, setCurrentForest] = useState<Forest | null>(null);

  const handleSoundChange = (sounds: { [key: string]: number }) => {
    const matchedForest = findMatchingForest(sounds);
    setCurrentForest(matchedForest);
  };

  return (
    <main className="relative min-h-screen w-full overflow-hidden">
      {/* Background Image with overlay */}
      <div className="fixed inset-0">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-500"
          style={{
            backgroundImage: currentForest 
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
          <ForestMatch forest={currentForest} />
        </div>

        {/* Equalizer */}
        <div className="w-full bg-black/30 backdrop-blur-md">
          <SoundEqualizer onSoundChange={handleSoundChange} />
        </div>
      </div>
    </main>
  );
}
