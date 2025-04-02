'use client';

import { useState, useEffect, useCallback } from 'react';
import { audioAssets } from '../data/audioAssets';
import { audioManager } from '../utils/audioManager';
import { TbWind, TbDroplet, TbFeather, TbCloudStorm, TbDropletFilled, TbBug, TbDeer, TbFlame, TbMoodSmile, TbPray } from 'react-icons/tb';
import { SoundType } from '../utils/forestMatcher';

interface SoundEqualizerProps {
  onSoundChange: (sounds: SoundType[]) => void;
}

const soundIcons = {
  wind: TbWind,
  rain: TbDroplet,
  birds: TbFeather,
  thunder: TbCloudStorm,
  water: TbDropletFilled,
  insects: TbBug,
  mammals: TbDeer,
  fire: TbFlame,
  ambient: TbMoodSmile,
  spiritual: TbPray
} as const;

const soundLabels: Record<SoundType, string> = {
  wind: 'Wind',
  rain: 'Rain',
  birds: 'Birds',
  thunder: 'Thunder',
  water: 'Water',
  insects: 'Insects',
  mammals: 'Mammals',
  fire: 'Fire',
  ambient: 'Ambient',
  spiritual: 'Spiritual'
};

interface SoundState {
  value: number;
  isActive: boolean;
  showSlider?: boolean;
}

type SoundProfile = {
  [K in SoundType]: SoundState;
};

export default function SoundEqualizer({ onSoundChange }: SoundEqualizerProps) {
  const [sounds, setSounds] = useState<SoundProfile>(() => {
    const initial: SoundProfile = {} as SoundProfile;
    Object.keys(soundIcons).forEach((sound) => {
      initial[sound as SoundType] = { value: 0, isActive: false, showSlider: false };
    });
    return initial;
  });

  const [activeSounds, setActiveSounds] = useState<SoundType[]>([]);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Load audio assets on mount
  useEffect(() => {
    const loadAudioAssets = async () => {
      try {
        await audioManager.initialize();
        // Load all audio assets
        Object.values(audioAssets).forEach(assets => {
          assets.forEach(asset => {
            audioManager.loadSound({
              id: asset.id,
              url: asset.url
            });
          });
        });
      } catch (error) {
        console.error('Failed to load audio assets:', error);
      }
    };

    loadAudioAssets();
    return () => {
      audioManager.cleanup();
    };
  }, []);

  // Update active sounds whenever a sound is toggled or its value changes
  useEffect(() => {
    const newActiveSounds = Object.entries(sounds)
      .filter(([_, sound]) => sound.isActive && sound.value > 0)
      .map(([name]) => name as SoundType);
    
    console.log('Active Sounds Update:', {
      newActiveSounds,
      currentActiveSounds: activeSounds,
      sounds
    });

    if (JSON.stringify(newActiveSounds) !== JSON.stringify(activeSounds)) {
      setActiveSounds(newActiveSounds);
      onSoundChange(newActiveSounds);
    }
  }, [sounds, activeSounds, onSoundChange]);

  const hasAudioAsset = (soundType: string): boolean => {
    return soundType in audioAssets;
  };

  // Memoize the slider change handler
  const handleSliderChange = useCallback(async (sound: SoundType, value: number) => {
    console.log('Slider Change:', {
      sound,
      value,
      currentState: sounds[sound],
      hasAudio: hasAudioAsset(sound)
    });

    setSounds(prev => {
      const newState = {
        ...prev,
        [sound]: {
          ...prev[sound],
          value,
          isActive: value > 0,
          showSlider: true
        }
      };
      console.log('New Sounds State:', newState);
      return newState;
    });

    // Handle audio playback
    if (hasAudioAsset(sound)) {
      try {
        Object.values(audioAssets[sound]).forEach(asset => {
          audioManager.stopSound(asset.id);
        });

        if (value > 0) {
          let intensity: 'soft' | 'moderate' | 'strong';
          if (value <= 0.33) {
            intensity = 'soft';
          } else if (value <= 0.66) {
            intensity = 'moderate';
          } else {
            intensity = 'strong';
          }

          const normalizedVolume = 0.3 + (value * 0.7);

          console.log('Audio Playback:', {
            sound,
            value,
            intensity,
            normalizedVolume
          });

          const asset = audioAssets[sound]?.find(a => a.intensity === intensity);
          if (asset) {
            await audioManager.playSound({
              id: asset.id,
              url: asset.url
            }, normalizedVolume);
          }
        }
      } catch (error) {
        console.error(`Failed to handle audio for ${sound}:`, error);
      }
    }
  }, [sounds, hasAudioAsset]);

  // Memoize the icon click handler
  const handleIconClick = useCallback(async (sound: SoundType) => {
    console.log('Icon Click:', {
      sound,
      currentState: sounds[sound],
      hasAudio: hasAudioAsset(sound)
    });

    setSounds(prev => {
      const newState = {
        ...prev,
        [sound]: {
          ...prev[sound],
          isActive: !prev[sound].isActive,
          value: prev[sound].isActive ? 0 : 0.5,
          showSlider: true
        }
      };
      console.log('New Sounds State:', newState);
      return newState;
    });

    if (hasAudioAsset(sound)) {
      try {
        Object.values(audioAssets[sound]).forEach(asset => {
          audioManager.stopSound(asset.id);
        });

        if (!sounds[sound].isActive) {
          console.log('Audio Playback (Icon):', {
            sound,
            intensity: 'soft',
            volume: 0.3
          });

          const asset = audioAssets[sound]?.find(a => a.intensity === 'soft');
          if (asset) {
            await audioManager.playSound({
              id: asset.id,
              url: asset.url
            }, 0.3);
          }
        }
      } catch (error) {
        console.error(`Failed to handle audio for ${sound}:`, error);
      }
    }
  }, [sounds, hasAudioAsset]);

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 md:p-6 z-50">
      <div className="grid grid-cols-5 md:grid-cols-10 gap-2 md:gap-4">
        {Object.entries(sounds).map(([sound, state]) => {
          const Icon = soundIcons[sound as keyof typeof soundIcons];
          const isActive = activeSounds.includes(sound as SoundType);
          const hasAudio = hasAudioAsset(sound);
          return (
            <div key={sound} className="flex flex-col items-center gap-2">
              {/* Slider container - hidden on mobile until interaction */}
              <div className={`relative h-32 md:h-36 w-12 flex items-center justify-center transition-all duration-300 ${
                state.showSlider ? 'opacity-100' : 'opacity-0 md:opacity-100'
              }`}>
                {/* Slider track background */}
                <div className="absolute inset-0 w-2 mx-auto rounded-full bg-gray-700/30" />
                
                {/* Active track */}
                <div 
                  className={`absolute bottom-0 w-2 mx-auto rounded-full transition-all ${
                    isActive 
                      ? hasAudio 
                        ? 'bg-blue-500/50' 
                        : 'bg-purple-500/50'
                      : 'bg-gray-500/30'
                  }`}
                  style={{ height: `${state.value * 100}%` }}
                />
                
                {/* Slider input with increased touch area */}
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={state.value}
                  onChange={(e) => handleSliderChange(sound as SoundType, parseFloat(e.target.value))}
                  className="absolute h-full w-8 md:w-2 appearance-none bg-transparent cursor-pointer touch-manipulation"
                  style={{
                    WebkitAppearance: 'slider-vertical',
                  }}
                />
              </div>
              
              {/* Icon and label with blurred background */}
              <div className="flex flex-col items-center gap-1 bg-black/10 backdrop-blur-md rounded-lg px-3 py-2">
                <button
                  onClick={() => handleIconClick(sound as SoundType)}
                  className={`p-2 md:p-2 rounded-full transition-all transform hover:scale-110 touch-manipulation ${
                    isActive 
                      ? hasAudio
                        ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                        : 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30'
                      : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
                  }`}
                  aria-label={`Toggle ${soundLabels[sound as keyof typeof soundLabels]}`}
                >
                  <Icon className="w-6 h-6 md:w-6 md:h-6" />
                </button>
                <span className={`text-[10px] md:text-xs font-medium ${
                  isActive 
                    ? hasAudio 
                      ? 'text-white' 
                      : 'text-white'
                    : 'text-white/60'
                }`}>
                  {soundLabels[sound as keyof typeof soundLabels]}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 