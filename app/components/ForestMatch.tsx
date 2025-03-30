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
      <p className="text-md text-white/60">{forest.vibe}</p>
    </div>
  );
} 