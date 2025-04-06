'use client';

import { Forest } from '../data/forests';

// Font style mapping for each forest type
const getForestFontStyle = (forestId: string) => {
  const fontStyles: Record<string, string> = {
    'amazon': 'font-serif tracking-wide font-bold',
    'black-forest': 'font-sans tracking-tight font-extrabold',
    'redwood': 'font-sans tracking-wide font-extrabold',
    'boreal': 'font-mono tracking-tight font-bold',
    'taiga': 'font-mono tracking-tight font-extrabold',
    'sundarbans': 'font-serif tracking-wide font-semibold',
    'aokigahara': 'font-serif tracking-wider font-bold italic',
    'tongass': 'font-sans tracking-wide font-bold',
    'jiuzhaigou': 'font-serif tracking-wider font-bold',
    'crooked': 'font-serif italic tracking-wide font-bold',
    'drakensberg': 'font-sans font-extrabold tracking-wide',
    'valdivian': 'font-serif tracking-wider font-bold',
    'sinharaja': 'font-serif tracking-wide font-bold',
    'białowieża': 'font-sans font-extrabold tracking-wider',
    'hoh': 'font-serif tracking-wide font-semibold',
    'daintree': 'font-serif tracking-wider font-extrabold',
    'congo': 'font-sans tracking-wide font-bold',
    'great-bear': 'font-mono tracking-tight font-bold',
    'yakushima': 'font-serif italic tracking-wider font-bold',
  };
  
  // Default font style if forest ID isn't found
  return fontStyles[forestId] || 'font-serif tracking-wide font-bold';
};

// Vibe tag style mapping for each forest type
const getVibeTagStyle = (forestId: string) => {
  const vibeStyles: Record<string, string> = {
    'amazon': 'bg-gradient-to-b from-green-600/30 to-green-600/20 text-green-800 border-green-600/20',
    'black-forest': 'bg-gradient-to-b from-gray-700/30 to-gray-800/20 text-gray-900 border-gray-700/20',
    'redwood': 'bg-gradient-to-b from-red-700/30 to-red-800/20 text-red-900 border-red-700/20',
    'boreal': 'bg-gradient-to-b from-blue-700/30 to-blue-800/20 text-blue-900 border-blue-700/20',
    'taiga': 'bg-gradient-to-b from-teal-600/30 to-teal-700/20 text-teal-800 border-teal-600/20',
    'sundarbans': 'bg-gradient-to-b from-emerald-600/30 to-emerald-700/20 text-emerald-800 border-emerald-600/20',
    'aokigahara': 'bg-gradient-to-b from-purple-600/30 to-purple-700/20 text-purple-800 border-purple-600/20',
    'tongass': 'bg-gradient-to-b from-cyan-600/30 to-cyan-700/20 text-cyan-800 border-cyan-600/20',
    'jiuzhaigou': 'bg-gradient-to-b from-orange-400/30 to-orange-500/20 text-orange-700 border-orange-400/20',
    'crooked': 'bg-gradient-to-b from-violet-500/30 to-violet-600/20 text-violet-800 border-violet-500/20',
    'drakensberg': 'bg-gradient-to-b from-amber-500/30 to-amber-600/20 text-amber-800 border-amber-500/20',
    'valdivian': 'bg-gradient-to-b from-lime-600/30 to-lime-700/20 text-lime-800 border-lime-600/20',
    'sinharaja': 'bg-gradient-to-b from-emerald-500/30 to-emerald-600/20 text-emerald-800 border-emerald-500/20',
    'białowieża': 'bg-gradient-to-b from-green-700/30 to-green-800/20 text-green-900 border-green-700/20',
    'hoh': 'bg-gradient-to-b from-teal-500/30 to-teal-600/20 text-teal-800 border-teal-500/20',
    'daintree': 'bg-gradient-to-b from-green-500/30 to-green-600/20 text-green-800 border-green-500/20',
    'congo': 'bg-gradient-to-b from-yellow-600/30 to-yellow-700/20 text-yellow-800 border-yellow-600/20',
    'great-bear': 'bg-gradient-to-b from-blue-600/30 to-blue-700/20 text-blue-800 border-blue-600/20',
    'yakushima': 'bg-gradient-to-b from-emerald-600/30 to-emerald-700/20 text-emerald-800 border-emerald-600/20',
  };
  
  // Default vibe style if forest ID isn't found
  return vibeStyles[forestId] || 'bg-gradient-to-b from-blue-600/30 to-blue-600/20 text-blue-800 border-blue-600/20';
};

interface ForestMatchProps {
  forest: Forest | null;
}

export default function ForestMatch({ forest }: ForestMatchProps) {
  if (!forest) return null;

  return (
    <div className="text-left w-full">
      {/* Forest vibes displayed as elegant tags */}
      <div className="flex flex-wrap gap-1.5">
        {forest.vibe.split(',').map((word, index) => (
          <span
            key={index}
            className={`px-2 py-0.5 rounded-md text-xs
                     backdrop-blur-[4px] border 
                     ${getVibeTagStyle(forest.id)}
                     shadow-[0_1px_2px_rgba(0,0,0,0.1),inset_0_1px_1px_rgba(255,255,255,0.2)]`}
            style={{
              textShadow: '0 1px 1px rgba(0,0,0,0.15)'
            }}
          >
            {word.trim()}
          </span>
        ))}
      </div>
      
      {/* Location with subtle styling */}
      <p 
        className="text-xs text-white/90 mt-2 font-medium tracking-wide"
        style={{
          textShadow: '0 1px 2px rgba(0,0,0,0.5)'
        }}
      >
        {forest.location}
      </p>
    </div>
  );
} 