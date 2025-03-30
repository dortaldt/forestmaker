'use client';

import { useState, useEffect } from 'react';
import { audioAssets } from '../data/audioAssets';
import { audioManager } from '../utils/audioManager';
import { TbWind, TbCloudRain, TbBolt, TbDroplet, TbFeather, TbBug, TbPaw, TbFlame, TbMusic, TbBellRinging, TbBugOff } from 'react-icons/tb';
import { SoundType, SoundProfile } from '../utils/forestMatcher';

interface SoundEqualizerProps {
  onSoundChange: (sounds: SoundProfile) => void;
}

const soundIcons = {
  wind: TbWind,
  rain: TbCloudRain,
  thunder: TbBolt,
  water: TbDroplet,
  birds: TbFeather,
  insects: TbBug,
  mammals: TbPaw,
  fire: TbFlame,
  ambient: TbMusic,
  spiritual: TbBellRinging
};

const soundLabels = {
  wind: 'Wind',
  rain: 'Rain',
  thunder: 'Thunder',
  water: 'Water',
  birds: 'Birds',
  insects: 'Insects',
  mammals: 'Mammals',
  fire: 'Fire',
  ambient: 'Ambient',
  spiritual: 'Spiritual'
};

const hasAudioAsset = (soundType: string): boolean => {
  return soundType in audioAssets;
};

export default function SoundEqualizer({ onSoundChange }: SoundEqualizerProps) {
  const [sounds, setSounds] = useState<SoundProfile>({
    wind: 0,
    rain: 0,
    birds: 0,
    thunder: 0,
    water: 0,
    insects: 0,
    mammals: 0,
    fire: 0,
    ambient: 0,
    spiritual: 0
  });

  const [activeSounds, setActiveSounds] = useState<Set<SoundType>>(new Set());

  // Load audio assets on mount
  useEffect(() => {
    const loadAudioAssets = async () => {
      try {
        await audioManager.initialize();
        // Load all audio assets from all categories
        for (const category of Object.values(audioAssets)) {
          for (const asset of Object.values(category)) {
            await audioManager.loadSound({
              id: asset.id,
              url: asset.url
            });
          }
        }
      } catch (error) {
        console.error('Failed to load audio assets:', error);
      }
    };

    loadAudioAssets();
  }, []);

  // Update active sounds whenever a sound is toggled or its value changes
  useEffect(() => {
    const newActiveSounds = new Set<SoundType>();
    Object.entries(sounds).forEach(([sound, value]) => {
      if (value > 0) {
        newActiveSounds.add(sound as SoundType);
      }
    });
    setActiveSounds(newActiveSounds);
  }, [sounds]);

  // Notify parent of sound changes
  useEffect(() => {
    onSoundChange(sounds);
  }, [sounds, onSoundChange]);

  const handleSliderChange = async (sound: SoundType, value: number) => {
    setSounds(prev => ({
      ...prev,
      [sound]: value
    }));

    // Handle audio playback
    if (hasAudioAsset(sound)) {
      try {
        // Stop all current sounds of this type
        Object.values(audioAssets[sound]).forEach(asset => {
          audioManager.stopSound(asset.id);
        });

        if (value > 0) {
          // Determine intensity based on value
          let intensity: 'soft' | 'moderate' | 'strong';
          if (value <= 0.33) {
            intensity = 'soft';
          } else if (value <= 0.66) {
            intensity = 'moderate';
          } else {
            intensity = 'strong';
          }

          // Normalize volume to be between 0.3 and 1.0
          const normalizedVolume = 0.3 + (value * 0.7);

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

    // Update forest match with current sound values
    onSoundChange(sounds);
  };

  const handleIconClick = async (sound: SoundType) => {
    const newValue = sounds[sound] === 0 ? 0.1 : 0;
    setSounds(prev => ({
      ...prev,
      [sound]: newValue
    }));

    if (hasAudioAsset(sound)) {
      try {
        // Stop all current sounds of this type
        Object.values(audioAssets[sound]).forEach(asset => {
          audioManager.stopSound(asset.id);
        });

        if (newValue > 0) {
          // Start with soft intensity when toggling on
          const asset = audioAssets[sound]?.find(a => a.intensity === 'soft');
          if (asset) {
            await audioManager.playSound({
              id: asset.id,
              url: asset.url
            }, 0.3); // Start at minimum volume
          }
        }
      } catch (error) {
        console.error(`Failed to handle audio for ${sound}:`, error);
      }
    }

    // Update forest match with current sound values
    onSoundChange(sounds);
  };

  return (
    <div className="w-full py-6 mb-32 md:mb-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Slider Grid */}
        <div className="grid grid-cols-5 md:grid-cols-10 gap-4">
          {Object.entries(sounds).map(([sound, value]) => {
            const Icon = soundIcons[sound as keyof typeof soundIcons];
            const isActive = activeSounds.has(sound as SoundType);
            const hasAudio = hasAudioAsset(sound);
            return (
              <div key={sound} className="flex flex-col items-center gap-2">
                <div className="relative h-32 md:h-36 w-12 flex items-center justify-center">
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
                    style={{ height: `${value * 100}%` }}
                  />
                  
                  {/* Slider input */}
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={value}
                    onChange={(e) => handleSliderChange(sound as SoundType, parseFloat(e.target.value))}
                    className="absolute h-full w-2 appearance-none bg-transparent cursor-pointer"
                    style={{
                      WebkitAppearance: 'slider-vertical',
                    }}
                  />
                </div>
                
                {/* Icon and label */}
                <div className="flex flex-col items-center gap-1">
                  <button
                    onClick={() => handleIconClick(sound as SoundType)}
                    className={`p-1.5 md:p-2 rounded-full transition-all transform hover:scale-110 ${
                      isActive 
                        ? hasAudio
                          ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                          : 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30'
                        : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
                    }`}
                    aria-label={`Toggle ${soundLabels[sound as keyof typeof soundLabels]}`}
                  >
                    <Icon className="w-5 h-5 md:w-6 md:h-6" />
                  </button>
                  <span className={`text-[10px] md:text-xs font-medium ${
                    isActive 
                      ? hasAudio 
                        ? 'text-white/80' 
                        : 'text-purple-200/80'
                      : 'text-gray-400'
                  }`}>
                    {soundLabels[sound as keyof typeof soundLabels]}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
} 