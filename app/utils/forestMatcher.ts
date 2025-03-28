import { Forest, forests } from '../data/forests';

export interface SoundProfile {
  wind: number;
  rain: number;
  birds: number;
  thunder: number;
  water: number;
  insects: number;
  mammals: number;
  fire: number;
  ambient: number;
  spiritual: number;
}

export type SoundType = keyof SoundProfile;

export function findMatchingForest(sounds: SoundProfile, activeSounds: Set<SoundType>): Forest {
  // If no sounds are active, return the first forest
  if (activeSounds.size === 0) {
    return forests[0];
  }

  // Create a filtered sound profile with only active sounds
  const activeSoundProfile: Partial<SoundProfile> = {};
  activeSounds.forEach(sound => {
    activeSoundProfile[sound] = sounds[sound];
  });

  // Calculate match scores for each forest
  const matchScores = forests.map((forest: Forest) => ({
    forest,
    score: calculateMatchScore(activeSoundProfile, forest.soundProfile, activeSounds)
  }));

  // Sort by score and return the best match
  matchScores.sort((a: { forest: Forest; score: number }, b: { forest: Forest; score: number }) => b.score - a.score);
  return matchScores[0].forest;
}

function calculateMatchScore(
  userSounds: Partial<SoundProfile>,
  forestSounds: SoundProfile,
  activeSounds: Set<SoundType>
): number {
  let totalScore = 0;
  let weightSum = 0;

  // Only consider active sounds
  activeSounds.forEach(sound => {
    const userValue = userSounds[sound] || 0;
    const forestValue = forestSounds[sound];
    
    // Calculate similarity (1 - difference)
    const similarity = 1 - Math.abs(userValue - forestValue);
    
    // Weight based on how active the sound is
    const weight = userValue;
    
    totalScore += similarity * weight;
    weightSum += weight;
  });

  // Normalize the score
  return weightSum > 0 ? totalScore / weightSum : 0;
} 