import { SoundProfile } from '../utils/forestMatcher';

export interface Forest {
  id: string;
  name: string;
  location: string;
  description: string;
  imageUrl: string;
  backgroundImage: string;
  vibe: string[];
  soundProfile: SoundProfile;
} 