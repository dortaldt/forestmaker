'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { audioAssets } from '../data/audioAssets';
import { audioManager } from '../utils/audioManager';
import { TbWind, TbDroplet, TbFeather, TbCloudStorm, TbDropletFilled, TbBug, TbDeer, TbFlame, TbMoodSmile, TbPray } from 'react-icons/tb';
import { SoundType } from '../utils/forestMatcher';
import SpotifyVolumeControl from './SpotifyVolumeControl';
import { getSpotifyClient } from '../utils/spotifyClient';
import ExpandableSlider from './ExpandableSlider';

interface SoundEqualizerProps {
  onSoundChange: (sounds: SoundType[], levels?: Record<SoundType, number>) => void;
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
  targetValue?: number;
}

type SoundProfile = {
  [K in SoundType]: SoundState;
};

export default function SoundEqualizer({ onSoundChange }: SoundEqualizerProps) {
  const [sounds, setSounds] = useState<SoundProfile>(() => {
    const initial: SoundProfile = {} as SoundProfile;
    Object.keys(soundIcons).forEach((sound) => {
      initial[sound as SoundType] = { value: 0, isActive: false, showSlider: false, targetValue: 0 };
    });
    return initial;
  });

  const [activeSounds, setActiveSounds] = useState<SoundType[]>([]);
  const [hasInteracted, setHasInteracted] = useState(false);
  const updateTimeoutRef = useRef<NodeJS.Timeout>();
  const animationFrameRef = useRef<number>();
  const lastSliderUpdateRef = useRef<Record<SoundType, { time: number, intensity?: string }>>({} as Record<SoundType, { time: number, intensity?: string }>);
  const sliderThrottleTimeRef = useRef<Record<SoundType, NodeJS.Timeout>>({} as Record<SoundType, NodeJS.Timeout>);
  const [isSpotifyLoggedIn, setIsSpotifyLoggedIn] = useState(false);

  // Check Spotify login status
  useEffect(() => {
    const client = getSpotifyClient();
    setIsSpotifyLoggedIn(!!client?.isLoggedIn());
  }, []);

  // Smooth value updates
  useEffect(() => {
    const updateValues = () => {
      let needsUpdate = false;
      const newSounds = { ...sounds };

      Object.entries(sounds).forEach(([sound, state]) => {
        if (state.targetValue !== undefined && state.value !== state.targetValue) {
          // Smooth transition to target value
          const diff = state.targetValue - state.value;
          const step = diff * 0.1; // Adjust this value to control smoothing speed
          
          if (Math.abs(diff) > 0.001) {
            newSounds[sound as SoundType] = {
              ...state,
              value: state.value + step
            };
            needsUpdate = true;
          } else {
            newSounds[sound as SoundType] = {
              ...state,
              value: state.targetValue
            };
            needsUpdate = true;
          }
        }
      });

      if (needsUpdate) {
        setSounds(newSounds);
      }

      animationFrameRef.current = requestAnimationFrame(updateValues);
    };

    animationFrameRef.current = requestAnimationFrame(updateValues);
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [sounds]);

  // Debounced forest update - with increased delay
  useEffect(() => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    updateTimeoutRef.current = setTimeout(() => {
      // Create a map of active sounds with their current values
      const activeSoundsWithValues = Object.entries(sounds)
        .filter(([_, sound]) => sound.isActive && sound.value > 0)
        .map(([name, sound]) => ({
          name: name as SoundType,
          value: sound.value
        }));

      // Sort by value to prioritize stronger sounds
      activeSoundsWithValues.sort((a, b) => b.value - a.value);

      // Take only the top 3 sounds to avoid overwhelming the forest matching
      const topSounds = activeSoundsWithValues.slice(0, 3).map(s => s.name);
      
      // Create a levels object with all sound values
      const soundLevels: Record<SoundType, number> = {} as Record<SoundType, number>;
      Object.entries(sounds).forEach(([name, sound]) => {
        if (sound.isActive && sound.value > 0) {
          soundLevels[name as SoundType] = sound.value;
        }
      });
      
      if (JSON.stringify(topSounds) !== JSON.stringify(activeSounds)) {
        console.log('Updating active sounds:', {
          topSounds,
          currentActiveSounds: activeSounds,
          allSounds: sounds
        });
        setActiveSounds(topSounds);
        onSoundChange(topSounds, soundLevels);
      }
    }, 350); // Increased debounce delay from 100ms to 350ms
  }, [sounds, activeSounds, onSoundChange]);

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

  const hasAudioAsset = (soundType: string): boolean => {
    return soundType in audioAssets;
  };

  // Get sound intensity based on value
  const getSoundIntensity = (value: number): 'soft' | 'moderate' | 'strong' => {
    if (value <= 0.33) return 'soft';
    if (value <= 0.66) return 'moderate';
    return 'strong';
  };

  // Track currently playing sounds and their intensities
  const currentlyPlayingRef = useRef<Record<SoundType, string>>({} as Record<SoundType, string>);

  // Handle audio playback with appropriate throttling
  const playSoundWithThrottle = useCallback(async (sound: SoundType, value: number) => {
    if (!hasAudioAsset(sound)) return;
    
    try {
      const now = Date.now();
      const lastUpdate = lastSliderUpdateRef.current[sound] || { time: 0 };
      const currentIntensity = getSoundIntensity(value);
      
      // If value is 0, just ensure sound is stopped and exit
      if (value === 0) {
        // Double-check that all instances are stopped
        const assetIds = Object.values(audioAssets[sound]).map(asset => asset.id);
        audioManager.ensureAllStopped(assetIds);
        // Clear currently playing reference
        currentlyPlayingRef.current[sound] = '';
        return;
      }
      
      // Find the asset with the matching intensity
      const asset = audioAssets[sound]?.find(a => a.intensity === currentIntensity);
      if (!asset) {
        console.error(`No asset found for ${sound} at intensity ${currentIntensity}`);
        return;
      }
      
      // Check if we need to change sounds (either due to intensity change or not playing at all)
      const shouldChangeSounds = 
        !currentlyPlayingRef.current[sound] || // Not playing
        (lastUpdate.intensity !== currentIntensity); // Different intensity
        
      if (shouldChangeSounds) {
        console.log(`[Audio Debug] Changing ${sound} sound to ${currentIntensity}`);
        
        // Stop all instances of this sound type
        const assetIds = Object.values(audioAssets[sound]).map(a => a.id);
        audioManager.ensureAllStopped(assetIds);
        
        // Play the new sound
        await audioManager.playSound({
          id: asset.id,
          url: asset.url
        }, value);
        
        // Update currently playing reference
        currentlyPlayingRef.current[sound] = asset.id;
        
        // Update last update info
        lastSliderUpdateRef.current[sound] = {
          time: now,
          intensity: currentIntensity
        };
      } else {
        // Just adjust volume of existing sound
        audioManager.setVolume(asset.id, value);
      }
    } catch (error) {
      console.error(`Failed to handle audio for ${sound}:`, error);
      
      // Emergency cleanup on error
      if (hasAudioAsset(sound)) {
        Object.values(audioAssets[sound]).forEach(asset => {
          audioManager.stopSound(asset.id);
        });
        // Clear currently playing reference
        currentlyPlayingRef.current[sound] = '';
      }
    }
  }, [hasAudioAsset]);

  // Memoize the slider change handler with throttling
  const handleSliderChange = useCallback((sound: SoundType, value: number) => {
    setHasInteracted(true);
    
    setSounds(prevSounds => ({
      ...prevSounds,
      [sound]: {
        ...prevSounds[sound],
        value,
        isActive: value > 0,
        targetValue: value
      }
    }));
    
    // Audio playback throttling
    if (sliderThrottleTimeRef.current[sound]) {
      clearTimeout(sliderThrottleTimeRef.current[sound]);
    }
    sliderThrottleTimeRef.current[sound] = setTimeout(() => {
      playSoundWithThrottle(sound, value);
    }, 50); // Small throttle delay for audio updates
  }, [playSoundWithThrottle]);

  return (
    <div className="w-full h-full flex items-center">
      <div className="max-w-3xl mx-auto w-full px-2">
        {/* Spotify Volume Control - only shown when logged in, now with skeuomorphic styling */}
        {isSpotifyLoggedIn && (
          <div className="mb-3">
            <div>
              <SpotifyVolumeControl />
            </div>
          </div>
        )}
        
        {/* Sound controls */}
        <div>
          {/* Grid layout for all screens - tighter gaps and bigger buttons */}
          <div className="grid grid-cols-3 md:grid-cols-5 gap-1.5 md:gap-2 mx-auto">
            {Object.entries(sounds).map(([sound, state]) => {
              const Icon = soundIcons[sound as keyof typeof soundIcons];
              const hasAudio = hasAudioAsset(sound);
              const isActive = state.isActive;
              
              return (
                <div 
                  id={`sound-control-${sound}`} 
                  key={`sound-${sound}`} 
                  className="aspect-square relative flex items-center justify-center overflow-visible"
                >
                  <ExpandableSlider 
                    icon={Icon}
                    label={soundLabels[sound as keyof typeof soundLabels]}
                    initialValue={state.value * 100}
                    min={0}
                    max={100}
                    onChange={(newValue) => handleSliderChange(sound as SoundType, newValue / 100)}
                    disabled={!hasAudio}
                    activeColor={hasAudio ? "orange-400" : "gray-400"}
                    className="w-full h-full rounded-xl"
                  />
                </div>
              );
            })}
          </div>
          
          {/* Small manufacturer label at bottom */}
          <div className="mt-2 flex justify-center">
            <div className="px-2 py-0.5 rounded-md 
                          bg-gradient-to-b from-gray-200/40 to-gray-300/40 
                          border border-gray-400/20
                          backdrop-filter backdrop-blur-[2px]
                          shadow-[0_2px_10px_rgba(0,0,0,0.08),inset_0_1px_1px_rgba(255,255,255,0.3)]">
              <span className="text-xs font-medium text-gray-700">ForestMaker Pro Series</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 