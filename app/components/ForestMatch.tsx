'use client';

import { Forest } from '../data/forests';

interface ForestMatchProps {
  forest: Forest | null;
}

export default function ForestMatch({ forest }: ForestMatchProps) {
  return (
    <div className="text-center min-h-[120px] md:min-h-[200px] flex flex-col justify-center">
      {!forest ? (
        <div className="text-center">
          <h2 className="text-xl md:text-2xl font-bold mb-1 md:mb-2 text-white/90">Forest Maker</h2>
          <p className="text-base md:text-lg text-white/70">
            Adjust the sliders to create your perfect forest atmosphere
          </p>
        </div>
      ) : (
        <>
          <h2 className="text-xl md:text-2xl font-bold mb-1 md:mb-2 text-white/90">{forest.name}</h2>
          <p className="text-base md:text-lg text-white/70 mb-1.5 md:mb-4">{forest.location}</p>
          <div className="flex flex-wrap justify-center gap-1 md:gap-2 mt-1 md:mt-2">
            {forest.vibe.split(',').map((word, index) => (
              <span
                key={index}
                className="px-2 md:px-3 py-0.5 md:py-1 rounded-full text-[10px] md:text-sm font-medium bg-gradient-to-r from-stone-500/10 to-zinc-500/10 text-stone-200 border border-stone-500/20 shadow-lg shadow-stone-500/5 backdrop-blur-sm"
              >
                {word.trim()}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
} 