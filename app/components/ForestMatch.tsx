'use client';

import { Forest } from '../data/forests';

type SoundType = keyof Forest['soundProfile'];

interface ForestMatchProps {
  currentForest: Forest | null;
  activeSounds: SoundType[];
  hasInteracted: boolean;
}

export default function ForestMatch({ currentForest, activeSounds, hasInteracted }: ForestMatchProps) {
  if (!hasInteracted) {
    return (
      <div className="text-center text-white/80 text-sm md:text-base">
        Adjust the sliders to find your perfect forest match
      </div>
    );
  }

  if (!currentForest) {
    return (
      <div className="text-center text-white/80 text-sm md:text-base">
        No forest match found. Try adjusting the sliders.
      </div>
    );
  }

  return (
    <div className="bg-black/20 backdrop-blur-md rounded-lg p-4 md:p-6 text-white">
      <h2 className="text-xl md:text-2xl font-bold mb-2">{currentForest.name}</h2>
      <p className="text-sm md:text-base text-white/80 mb-4">{currentForest.location}</p>
      <div className="flex flex-wrap gap-2">
        {currentForest.vibe.split(',').map((tag, index) => (
          <span
            key={index}
            className="px-3 py-1 rounded-full text-xs md:text-sm bg-black/20 backdrop-blur-md border border-white/10 shadow-lg"
          >
            {tag.trim()}
          </span>
        ))}
      </div>
    </div>
  );
} 