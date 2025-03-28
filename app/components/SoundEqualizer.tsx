'use client';

import { useState, useEffect } from 'react';
import { audioAssets } from '../data/audioAssets';
import { audioManager } from '../utils/audioManager';
import { TbWind, TbCloudRain, TbBolt, TbDroplet, TbFeather, TbBug, TbPaw, TbFlame, TbMusic, TbBellRinging, TbBugOff } from 'react-icons/tb';

interface SoundEqualizerProps {
  onSoundChange: (sounds: { [key: string]: number }) => void;
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
  const [sounds, setSounds] = useState<{ [key: string]: number }>({
    wind: 0.5,
    rain: 0.5,
    thunder: 0.5,
    water: 0.5,
    birds: 0.5,
    insects: 0.5,
    mammals: 0.5,
    fire: 0.5,
    ambient: 0.5,
    spiritual: 0.5
  });

  const [activeSounds, setActiveSounds] = useState<{ [key: string]: boolean }>({
    wind: false,
    rain: false,
    thunder: false,
    water: false,
    birds: false,
    insects: false,
    mammals: false,
    fire: false,
    ambient: false,
    spiritual: false
  });

  const [showDebug, setShowDebug] = useState(false);
  const [lastChange, setLastChange] = useState<{ type: string; value: number; timestamp: number } | null>(null);

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

  const handleSliderChange = (soundType: string, value: number) => {
    console.log(`Slider change: ${soundType} = ${value}`);
    
    const newSounds = { ...sounds };
    newSounds[soundType] = value;
    setSounds(newSounds);

    // Update last change for debug display
    setLastChange({
      type: soundType,
      value: value,
      timestamp: Date.now()
    });

    // Handle audio playback
    if (hasAudioAsset(soundType)) {
      // First, stop all current sounds of this type
      Object.values(audioAssets[soundType]).forEach(asset => {
        audioManager.stopSound(asset.id);
      });

      if (value > 0) {
        // Activate sound if not already active
        if (!activeSounds[soundType]) {
          setActiveSounds(prev => ({ ...prev, [soundType]: true }));
        }

        let intensity: 'soft' | 'moderate' | 'strong';
        if (value <= 0.33) {
          intensity = 'soft';
        } else if (value <= 0.66) {
          intensity = 'moderate';
        } else {
          intensity = 'strong';
        }

        const asset = audioAssets[soundType]?.find(a => a.intensity === intensity);
        if (asset) {
          console.log(`Playing sound: ${asset.id} with intensity ${intensity}`);
          // Apply normalization to the volume
          const normalizedVolume = value * 0.7;
          audioManager.playSound(asset.id, normalizedVolume);
        }
      } else {
        console.log(`Stopping sound: ${soundType}`);
        setActiveSounds(prev => ({ ...prev, [soundType]: false }));
      }
    }

    // Immediately update forest match with all current sound values
    onSoundChange(newSounds);
  };

  const handleIconClick = (soundType: string) => {
    console.log(`Icon clicked: ${soundType}`);
    const isCurrentlyActive = activeSounds[soundType];
    
    // Toggle active state without changing slider value
    setActiveSounds(prev => ({
      ...prev,
      [soundType]: !isCurrentlyActive
    }));

    // Handle audio if available
    if (hasAudioAsset(soundType)) {
      if (!isCurrentlyActive) {
        // Play sound at current slider value when toggling on
        const currentValue = sounds[soundType];
        let intensity: 'soft' | 'moderate' | 'strong';
        if (currentValue <= 0.33) {
          intensity = 'soft';
        } else if (currentValue <= 0.66) {
          intensity = 'moderate';
        } else {
          intensity = 'strong';
        }

        const asset = audioAssets[soundType]?.find(a => a.intensity === intensity);
        if (asset) {
          console.log(`Playing sound: ${asset.id} with intensity ${intensity}`);
          // Apply normalization to the volume
          const normalizedVolume = currentValue * 0.7;
          audioManager.playSound(asset.id, normalizedVolume);
        }
      } else {
        console.log(`Stopping sound: ${soundType}`);
        // Stop all sounds of this type
        Object.values(audioAssets[soundType]).forEach(asset => {
          audioManager.stopSound(asset.id);
        });
      }
    }

    // Update last change for debug display
    setLastChange({
      type: soundType,
      value: sounds[soundType],
      timestamp: Date.now()
    });

    // Update forest match with current sound values
    onSoundChange(sounds);
  };

  // Add effect to update forest match when sounds change
  useEffect(() => {
    console.log('Sounds updated:', sounds);
    onSoundChange(sounds);
  }, [sounds, onSoundChange]);

  const toggleDebug = () => {
    console.log(`Debug mode ${showDebug ? 'disabled' : 'enabled'}`);
    setShowDebug(!showDebug);
  };

  return (
    <div className="w-full py-6">
      <div className="max-w-6xl mx-auto px-4">
        {/* Debug Button */}
        <div className="flex justify-end mb-4">
          <button
            onClick={toggleDebug}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-800/50 hover:bg-gray-800/70 text-gray-300 text-sm transition-colors"
          >
            <TbBugOff className="w-4 h-4" />
            {showDebug ? 'Hide Debug' : 'Show Debug'}
          </button>
        </div>

        {/* Debug Display */}
        {showDebug && (
          <div className="mb-4 p-4 bg-gray-800/30 rounded-lg">
            <h3 className="text-sm font-medium text-gray-300 mb-2">Slider Values:</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {Object.entries(sounds).map(([soundType, value]) => (
                <div key={soundType} className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">{soundType}:</span>
                  <span className={`text-gray-200 ${lastChange?.type === soundType ? 'text-blue-400' : ''}`}>
                    {value.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
            {lastChange && (
              <div className="mt-2 text-xs text-gray-400">
                Last change: {lastChange.type} = {lastChange.value.toFixed(2)} ({new Date(lastChange.timestamp).toLocaleTimeString()})
              </div>
            )}
          </div>
        )}

        {/* Slider Grid */}
        <div className="grid grid-cols-5 md:grid-cols-10 gap-4">
          {Object.entries(sounds).map(([soundType, value]) => {
            const Icon = soundIcons[soundType as keyof typeof soundIcons];
            const isActive = activeSounds[soundType];
            const hasAudio = hasAudioAsset(soundType);
            return (
              <div key={soundType} className="flex flex-col items-center gap-2">
                <div className="relative h-48 w-12 flex items-center justify-center">
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
                    onChange={(e) => handleSliderChange(soundType, parseFloat(e.target.value))}
                    className="absolute h-full w-2 appearance-none bg-transparent cursor-pointer"
                    style={{
                      WebkitAppearance: 'slider-vertical',
                    }}
                  />
                </div>
                
                {/* Icon and label */}
                <div className="flex flex-col items-center gap-1">
                  <button
                    onClick={() => handleIconClick(soundType)}
                    className={`p-2 rounded-full transition-all transform hover:scale-110 ${
                      isActive 
                        ? hasAudio
                          ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                          : 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30'
                        : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
                    }`}
                    aria-label={`Toggle ${soundLabels[soundType as keyof typeof soundLabels]}`}
                  >
                    <Icon className="w-6 h-6" />
                  </button>
                  <span className={`text-xs font-medium ${
                    isActive 
                      ? hasAudio 
                        ? 'text-white/80' 
                        : 'text-purple-200/80'
                      : 'text-gray-400'
                  }`}>
                    {soundLabels[soundType as keyof typeof soundLabels]}
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