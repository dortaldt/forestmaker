export interface Forest {
  id: string;
  name: string;
  location: string;
  vibe: string;
  description: string;
  imageUrl: string;
  colorScheme: {
    primary: string;
    secondary: string;
    accent: string;
  };
  soundProfile: {
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
  };
}

export const forests: Forest[] = [
  {
    id: 'amazon',
    name: 'Amazon Rainforest',
    location: 'South America',
    vibe: 'Lush, vibrant, and teeming with life',
    description: 'One of the most biodiverse places on Earth, teeming with bird calls, insects, and sudden rainfall.',
    imageUrl: '/assets/images/forest1.png',
    colorScheme: {
      primary: '#2D5A27',
      secondary: '#1A3D17',
      accent: '#8BC34A'
    },
    soundProfile: {
      wind: 0.2,    // Light wind due to dense canopy
      rain: 0.8,    // Heavy rainfall
      birds: 0.9,   // Many bird species
      thunder: 0.7, // Frequent thunderstorms
      water: 0.6,   // Rivers and streams
      insects: 0.9, // Abundant insects
      mammals: 0.7, // Various mammals
      fire: 0.1,    // Rare fires
      ambient: 0.8, // Rich ambient sounds
      spiritual: 0.3 // Indigenous spiritual presence
    }
  },
  {
    id: 'black-forest',
    name: 'Black Forest',
    location: 'Germany',
    vibe: 'Mysterious, ancient, and enchanting',
    description: 'This ancient European woodland is known for its dense pine trees and moody atmosphere.',
    imageUrl: '/assets/images/forest2.png',
    colorScheme: {
      primary: '#1B5E20',
      secondary: '#0A280E',
      accent: '#4CAF50'
    },
    soundProfile: {
      wind: 0.7,    // Strong winds through pines
      rain: 0.6,    // Moderate rainfall
      birds: 0.5,   // Moderate bird activity
      thunder: 0.4, // Occasional storms
      water: 0.3,   // Some streams
      insects: 0.4, // Moderate insects
      mammals: 0.6, // Deer and other mammals
      fire: 0.2,    // Rare fires
      ambient: 0.7, // Mysterious ambient sounds
      spiritual: 0.8 // Strong spiritual presence
    }
  },
  {
    id: 'redwood',
    name: 'Redwood Forest',
    location: 'California',
    vibe: 'Majestic, peaceful, and awe-inspiring',
    description: 'Towering trees and peaceful wildlife make this forest feel like a natural cathedral.',
    imageUrl: '/assets/images/forest3.png',
    colorScheme: {
      primary: '#3E2723',
      secondary: '#1B0000',
      accent: '#795548'
    },
    soundProfile: {
      wind: 0.8,    // Strong coastal winds
      rain: 0.5,    // Moderate rainfall
      birds: 0.6,   // Coastal birds
      thunder: 0.3, // Rare thunderstorms
      water: 0.4,   // Coastal moisture
      insects: 0.3, // Few insects
      mammals: 0.5, // Some mammals
      fire: 0.1,    // Rare fires
      ambient: 0.6, // Peaceful ambient sounds
      spiritual: 0.5 // Moderate spiritual presence
    }
  },
  {
    id: 'boreal',
    name: 'Boreal Forest',
    location: 'Canada',
    vibe: 'Serene, vast, and pristine',
    description: 'A vast coniferous forest stretching across the northern hemisphere, quiet and frigid.',
    imageUrl: '/assets/images/forest4.png',
    colorScheme: {
      primary: '#3E2723',
      secondary: '#1B0000',
      accent: '#795548'
    },
    soundProfile: {
      wind: 0.9,    // Strong northern winds
      rain: 0.4,    // Light rainfall
      birds: 0.4,   // Seasonal birds
      thunder: 0.2, // Rare thunderstorms
      water: 0.3,   // Some lakes
      insects: 0.2, // Few insects
      mammals: 0.4, // Some mammals
      fire: 0.3,    // Occasional fires
      ambient: 0.5, // Quiet ambient sounds
      spiritual: 0.4 // Light spiritual presence
    }
  },
  {
    id: 'tropical',
    name: 'Tropical Rainforest',
    location: 'Costa Rica',
    vibe: 'Vibrant, diverse, and energetic',
    description: 'An ancient rainforest brushing up against the sea, home to exotic birds and reptiles.',
    imageUrl: '/assets/images/forest5.png',
    colorScheme: {
      primary: '#1B5E20',
      secondary: '#0A280E',
      accent: '#4CAF50'
    },
    soundProfile: {
      wind: 0.3,    // Light wind
      rain: 0.9,    // Heavy rainfall
      birds: 0.9,   // Many bird species
      thunder: 0.8, // Frequent thunderstorms
      water: 0.7,   // Many streams
      insects: 0.9, // Abundant insects
      mammals: 0.8, // Many mammals
      fire: 0.1,    // Rare fires
      ambient: 0.9, // Rich ambient sounds
      spiritual: 0.4 // Moderate spiritual presence
    }
  },
  {
    id: 'hoh',
    name: 'Hoh Rainforest',
    location: 'Washington, USA',
    vibe: 'Mossy, mystical, wet',
    description: 'A temperate rainforest shrouded in mist and moss with rich rainfall and tranquil streams.',
    imageUrl: '/assets/images/forest1.png',
    colorScheme: {
      primary: '#1B5E20',
      secondary: '#0A280E',
      accent: '#4CAF50'
    },
    soundProfile: {
      wind: 30,
      rain: 90,
      thunder: 30,
      water: 80,
      birds: 60,
      insects: 40,
      mammals: 30,
      fire: 10,
      ambient: 50,
      spiritual: 25
    }
  },
  {
    id: 'bialowieza',
    name: 'Białowieża Forest',
    location: 'Poland/Belarus',
    vibe: 'Ancient, cool, biodiverse',
    description: 'One of the last primeval forests in Europe, filled with bison, birds, and mystery.',
    imageUrl: '/assets/images/forest2.png',
    colorScheme: {
      primary: '#2D5A27',
      secondary: '#1A3D17',
      accent: '#8BC34A'
    },
    soundProfile: {
      wind: 40,
      rain: 50,
      thunder: 20,
      water: 30,
      birds: 60,
      insects: 50,
      mammals: 50,
      fire: 20,
      ambient: 40,
      spiritual: 20
    }
  },
  {
    id: 'daintree',
    name: 'Daintree Rainforest',
    location: 'Australia',
    vibe: 'Tropical, coastal, alive',
    description: 'An ancient rainforest brushing up against the sea, home to exotic birds and reptiles.',
    imageUrl: '/assets/images/forest3.png',
    colorScheme: {
      primary: '#1B5E20',
      secondary: '#0A280E',
      accent: '#4CAF50'
    },
    soundProfile: {
      wind: 30,
      rain: 70,
      thunder: 40,
      water: 60,
      birds: 80,
      insects: 90,
      mammals: 20,
      fire: 0,
      ambient: 30,
      spiritual: 20
    }
  },
  {
    id: 'taiga',
    name: 'Taiga (Boreal Forest)',
    location: 'Siberia',
    vibe: 'Cold, sparse, remote',
    description: 'A vast coniferous forest stretching across the northern hemisphere, quiet and frigid.',
    imageUrl: '/assets/images/forest1.png',
    colorScheme: {
      primary: '#3E2723',
      secondary: '#1B0000',
      accent: '#795548'
    },
    soundProfile: {
      wind: 70,
      rain: 20,
      thunder: 10,
      water: 10,
      birds: 30,
      insects: 10,
      mammals: 40,
      fire: 30,
      ambient: 60,
      spiritual: 10
    }
  },
  {
    id: 'congo',
    name: 'Congo Rainforest',
    location: 'Central Africa',
    vibe: 'Hot, wild, rhythmic',
    description: 'Deep jungle filled with insect life, rhythmic rain, and primal musical echoes.',
    imageUrl: '/assets/images/forest2.png',
    colorScheme: {
      primary: '#2D5A27',
      secondary: '#1A3D17',
      accent: '#8BC34A'
    },
    soundProfile: {
      wind: 20,
      rain: 80,
      thunder: 30,
      water: 40,
      birds: 60,
      insects: 90,
      mammals: 50,
      fire: 10,
      ambient: 40,
      spiritual: 70
    }
  },
  {
    id: 'aokigahara',
    name: 'Aokigahara Forest',
    location: 'Japan',
    vibe: 'Eerie, silent, spiritual',
    description: 'A haunting forest at the foot of Mount Fuji, steeped in silence and folklore.',
    imageUrl: '/assets/images/forest3.png',
    colorScheme: {
      primary: '#1B5E20',
      secondary: '#0A280E',
      accent: '#4CAF50'
    },
    soundProfile: {
      wind: 10,
      rain: 30,
      thunder: 0,
      water: 10,
      birds: 20,
      insects: 10,
      mammals: 20,
      fire: 0,
      ambient: 60,
      spiritual: 90
    }
  },
  {
    id: 'sundarbans',
    name: 'Sundarbans Mangrove Forest',
    location: 'Bangladesh/India',
    vibe: 'Muddy, humid, wild',
    description: 'A tidal mangrove forest, echoing with birds and tigers, interlaced with flowing water.',
    imageUrl: '/assets/images/forest1.png',
    colorScheme: {
      primary: '#2D5A27',
      secondary: '#1A3D17',
      accent: '#8BC34A'
    },
    soundProfile: {
      wind: 30,
      rain: 60,
      thunder: 50,
      water: 90,
      birds: 70,
      insects: 80,
      mammals: 50,
      fire: 0,
      ambient: 30,
      spiritual: 20
    }
  }
]; 