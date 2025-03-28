'use client';

import React, { useEffect, useState } from 'react';
import { Forest } from '../data/forests';

interface ForestMatchProps {
  forest: Forest | null;
}

export default function ForestMatch({ forest }: ForestMatchProps) {
  if (!forest) {
    return (
      <div className="text-center p-8">
        <h2 className="text-3xl font-bold text-white mb-4">Welcome to Forest Maker</h2>
        <p className="text-gray-300 text-lg">Adjust the sliders to create your perfect forest atmosphere</p>
      </div>
    );
  }

  return (
    <div className="text-center p-8">
      <h2 className="text-4xl font-bold text-white mb-2">{forest.name}</h2>
      <h3 className="text-xl text-gray-300 mb-4">{forest.location}</h3>
      <p className="text-gray-200 text-lg mb-6 max-w-2xl mx-auto">{forest.description}</p>
      <div className="flex flex-wrap gap-3 justify-center">
        <span className="px-4 py-2 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">
          {forest.vibe}
        </span>
      </div>
    </div>
  );
} 