'use client';

import { Forest } from '../data/forests';

interface ForestMatchProps {
  forest: Forest | null;
}

export default function ForestMatch({ forest }: ForestMatchProps) {
  return (
    <div className="text-center flex flex-col justify-start w-full max-w-md mx-auto">
      {!forest ? (
        <div className="text-center backdrop-filter backdrop-blur-[2px] rounded-xl px-4 py-3 inline-block mx-auto 
                       bg-gradient-to-b from-gray-200/40 to-gray-300/40 
                       border border-gray-400/20
                       shadow-[0_2px_10px_rgba(0,0,0,0.08),inset_0_1px_1px_rgba(255,255,255,0.3)]">
          <h2 className="text-lg md:text-xl font-bold mb-1 text-gray-800">Welcome to Forest Maker</h2>
          <p className="text-xs md:text-sm text-gray-700 max-w-xs mx-auto">
            Adjust the sliders below to create your perfect forest atmosphere
          </p>
        </div>
      ) : (
        <div className="backdrop-filter backdrop-blur-[2px] rounded-xl px-4 py-3 inline-block mx-auto
                       bg-gradient-to-b from-gray-200/40 to-gray-300/40
                       border border-gray-400/20
                       shadow-[0_2px_10px_rgba(0,0,0,0.08),inset_0_1px_1px_rgba(255,255,255,0.3)]">
          <h2 className="text-lg md:text-xl font-bold mb-1 text-gray-800">{forest.name}</h2>
          <p className="text-xs md:text-sm text-gray-700 mb-2 max-w-md mx-auto">{forest.location}</p>
          <div className="flex flex-wrap justify-center gap-1.5">
            {forest.vibe.split(',').map((word, index) => (
              <span
                key={index}
                className="px-2 py-0.5 rounded-md text-xs font-medium 
                         bg-gradient-to-b from-blue-600/30 to-blue-600/20 
                         text-blue-800 border border-blue-600/20
                         shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
              >
                {word.trim()}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 