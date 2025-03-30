'use client';

import { Forest } from '../data/forests';

interface ForestMatchProps {
  forest: Forest | null;
}

export default function ForestMatch({ forest }: ForestMatchProps) {
  if (!forest) {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4 text-white/90">Welcome to Forest Maker</h2>
        <p className="text-xl text-white/70">
          Adjust the sliders below to create your perfect forest atmosphere
        </p>
      </div>
    );
  }

  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold mb-2 text-white/90">{forest.name}</h2>
      <p className="text-lg text-white/70 mb-4">{forest.location}</p>
      <div className="flex flex-wrap justify-center gap-2 mt-2">
        {forest.vibe.split(',').map((word, index) => (
          <span
            key={index}
            className="px-3 py-1 rounded-full text-xs md:text-sm font-medium bg-gradient-to-r from-stone-500/10 to-zinc-500/10 text-stone-200 border border-stone-500/20 shadow-lg shadow-stone-500/5 backdrop-blur-sm"
          >
            {word.trim()}
          </span>
        ))}
      </div>
    </div>
  );
} 