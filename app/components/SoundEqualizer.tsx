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
    console.log('Loading audio assets...');
    Object.values(audioAssets).forEach(category => {
      Object.values(category).forEach(asset => {
        audioManager.loadSound(asset.id, asset.url);
      });
    });

    return () => {
      console.log('Cleaning up audio...');
      audioManager.stopAllSounds();
    };
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

  const handleSliderChange = (sound: SoundType, value: number) => {
    console.log(`Slider change: ${sound} = ${value}`);
    
    setSounds(prev => ({
      ...prev,
      [sound]: value
    }));

    // Handle audio playback
    if (hasAudioAsset(sound)) {
      // First, stop all current sounds of this type
      Object.values(audioAssets[sound]).forEach(asset => {
        audioManager.stopSound(asset.id);
      });

      if (value > 0) {
        // Activate sound if not already active
        if (!activeSounds.has(sound)) {
          setActiveSounds(prev => new Set([...prev, sound]));
        }

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
          console.log(`Playing sound: ${asset.id} with intensity ${intensity}`);
          audioManager.playSound(asset.id, normalizedVolume);
        }
      } else {
        console.log(`Stopping sound: ${sound}`);
        setActiveSounds(prev => {
          const newSet = new Set(prev);
          newSet.delete(sound);
          return newSet;
        });
      }
    }

    // Update forest match with current sound values
    onSoundChange(sounds);
  };

  const handleIconClick = (sound: SoundType) => {
    console.log(`Icon clicked: ${sound}`);
    const isCurrentlyActive = activeSounds.has(sound as SoundType);
    
    // Toggle active state with new logic
    setSounds(prev => ({
      ...prev,
      [sound]: prev[sound] > 0 ? 0 : 0.1 // Toggle between 0 and 0.1
    }));

    // Handle audio if available
    if (hasAudioAsset(sound)) {
      if (!isCurrentlyActive) {
        // Play sound at soft intensity when toggling on
        const asset = audioAssets[sound]?.find(a => a.intensity === 'soft');
        if (asset) {
          console.log(`Playing sound: ${asset.id} with intensity soft`);
          audioManager.playSound(asset.id, 0.3); // Start at minimum volume
        }
      } else {
        console.log(`Stopping sound: ${sound}`);
        // Stop all sounds of this type
        Object.values(audioAssets[sound]).forEach(asset => {
          audioManager.stopSound(asset.id);
        });
      }
    }

    // Update forest match with current sound values
    onSoundChange(sounds);
  };

  return (
    <div className="w-full p-6">
      {/* Slider Grid */}
      <div className="grid grid-cols-5 md:grid-cols-10 gap-4">
        {Object.entries(sounds).map(([sound, value]) => {
          const Icon = soundIcons[sound as keyof typeof soundIcons];
          const isActive = activeSounds.has(sound as SoundType);
          const hasAudio = hasAudioAsset(sound);
          return (
            <div key={sound} className="flex flex-col items-center gap-2">
              <div className="relative h-48 w-12 flex items-center justify-center">
                {/* Slider track background */}
                <div className="absolute h-full w-2 bg-gray-700/50 rounded-full" />
                
                {/* Active sound indicator */}
                {isActive && (
                  <div 
                    className="absolute h-full w-2 bg-blue-500/50 rounded-full"
                    style={{
                      height: `${value * 100}%`,
                      bottom: 0
                    }}
                  />
                )}
                
                {/* Slider handle */}
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={value}
                  onChange={(e) => handleSliderChange(sound as SoundType, parseFloat(e.target.value))}
                  className="absolute h-full w-2 appearance-none bg-transparent cursor-pointer"
                  style={{
                    background: `linear-gradient(to top, ${
                      isActive ? '#3B82F6' : '#9CA3AF'
                    } ${value * 100}%, transparent ${value * 100}%)`
                  }}
                />
              </div>

              <div className="flex flex-col items-center gap-1">
                <button
                  onClick={() => handleIconClick(sound as SoundType)}
                  className={`p-2 rounded-full transition-all transform hover:scale-110 ${
                    isActive 
                      ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                      : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
                  }`}
                  aria-label={`Toggle ${soundLabels[sound as keyof typeof soundLabels]}`}
                >
                  <Icon className="w-6 h-6" />
                </button>
                <span className={`text-sm font-medium ${
                  isActive 
                    ? 'text-blue-400'
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
  );
} 