import { Forest } from '../data/forests';

interface SoundProfile {
  id: string;
  value: number;
}

// Update to include all possible sound types
type SoundType = 'wind' | 'rain' | 'birds' | 'thunder' | 'water' | 'insects' | 'mammals' | 'fire' | 'ambient' | 'spiritual';

export function findMatchingForest(sounds: { [key: string]: number }): Forest {
  // Convert sounds object to array format and filter for active sounds
  const soundProfile: SoundProfile[] = Object.entries(sounds)
    .filter(([_, value]) => value > 0) // Only consider active sounds
    .map(([id, value]) => ({
      id,
      value: value // Use the direct value from the slider
    }));

  console.log('Active sounds:', soundProfile);

  // If no sounds are active, return the first forest
  if (soundProfile.length === 0) {
    return require('../data/forests').forests[0];
  }

  // Find the forest with the closest match
  const forests = require('../data/forests').forests;
  let bestMatch = forests[0];
  let bestScore = -Infinity;

  forests.forEach((forest: Forest) => {
    const score = calculateMatchScore(soundProfile, forest);
    console.log(`Forest ${forest.name} score:`, score);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = forest;
    }
  });

  console.log('Forest match:', bestMatch.name, 'Score:', bestScore);
  return bestMatch;
}

function calculateMatchScore(sounds: SoundProfile[], forest: Forest): number {
  let score = 0;
  let totalWeight = 0;
  
  sounds.forEach(sound => {
    // Only consider sounds that exist in both profiles
    if (sound.id in forest.soundProfile) {
      const forestValue = forest.soundProfile[sound.id as SoundType];
      // Calculate similarity based on how close the values are
      const difference = Math.abs(sound.value - forestValue);
      // Use a more forgiving similarity calculation
      const similarity = 1 - (difference * 0.5); // Reduce the impact of differences
      score += similarity;
      totalWeight += 1;
    }
  });

  // Normalize score
  const normalizedScore = totalWeight > 0 ? score / totalWeight : 0;
  return normalizedScore;
} 