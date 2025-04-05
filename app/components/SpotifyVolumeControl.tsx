'use client';

import React, { useState, useEffect, useRef } from 'react';
import { TbBrandSpotify, TbVolume, TbVolume2, TbVolume3, TbVolumeOff, TbMusic, TbPlayerPlay, TbPlayerPause } from 'react-icons/tb';
import { getSpotifyClient, SpotifyTrack } from '../utils/spotifyClient';
import ExpandableSlider from './ExpandableSlider';

interface SpotifyVolumeControlProps {
  isVisible?: boolean;
}

const SpotifyVolumeControl: React.FC<SpotifyVolumeControlProps> = ({ isVisible = true }) => {
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [previousVolume, setPreviousVolume] = useState(80);
  const [currentTrack, setCurrentTrack] = useState<SpotifyTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check login status on mount
  useEffect(() => {
    const client = getSpotifyClient();
    if (client?.isLoggedIn()) {
      setIsLoggedIn(true);
      
      // Start polling for current track
      startPollingCurrentTrack();

      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
      };
    }
  }, []);

  // Poll for current track information
  const startPollingCurrentTrack = () => {
    const pollInterval = 3000; // Poll every 3 seconds
    
    // Initial check
    checkCurrentTrack();
    
    // Set up polling
    pollingIntervalRef.current = setInterval(() => {
      checkCurrentTrack();
    }, pollInterval);
  };

  // Check what's currently playing
  const checkCurrentTrack = async () => {
    const client = getSpotifyClient();
    if (client) {
      const track = await client.getCurrentlyPlaying();
      if (track) {
        setCurrentTrack(track);
        setIsPlaying(true);
      } else {
        // If no track is playing, keep the current track info but update playing state
        setIsPlaying(false);
      }
    }
  };

  // Handle volume change
  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    
    // Update Spotify volume
    const client = getSpotifyClient();
    if (client) {
      client.setVolume(newVolume);
    }
  };

  // Toggle mute
  const toggleMute = () => {
    if (isMuted) {
      setVolume(previousVolume);
      setIsMuted(false);
      
      // Unmute by setting volume back to previous level
      const client = getSpotifyClient();
      if (client) {
        client.setVolume(previousVolume);
      }
    } else {
      setPreviousVolume(volume);
      setVolume(0);
      setIsMuted(true);
      
      // Mute by setting volume to 0
      const client = getSpotifyClient();
      if (client) {
        client.setVolume(0);
      }
    }
  };

  // Toggle play/pause
  const togglePlayback = () => {
    const client = getSpotifyClient();
    if (!client) return;

    if (isPlaying) {
      client.pause().then(success => {
        if (success) setIsPlaying(false);
      });
    } else if (currentTrack) {
      client.play(currentTrack.uri).then(success => {
        if (success) setIsPlaying(true);
      });
    }
  };

  // Get volume icon based on volume level
  const getVolumeIcon = () => {
    if (isMuted || volume === 0) return TbVolumeOff;
    if (volume < 33) return TbVolume;
    if (volume < 66) return TbVolume2;
    return TbVolume3;
  };

  if (!isVisible || !isLoggedIn) return null;

  const VolumeIcon = getVolumeIcon();

  // Get LED color based on volume
  const getLedColor = () => {
    if (isMuted || volume === 0) return 'bg-gray-400';
    if (volume < 33) return 'bg-green-500';
    if (volume < 66) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="spotify-volume-control w-full">
      <div className="flex flex-col md:flex-row gap-2">
        {/* Current track section - styled like ExpandableSlider */}
        <div className="flex-grow rounded-xl overflow-hidden 
                       bg-gradient-to-b from-gray-200/40 to-gray-300/40 
                       border border-gray-400/20
                       backdrop-filter backdrop-blur-[2px]
                       shadow-[0_2px_10px_rgba(0,0,0,0.08),inset_0_1px_1px_rgba(255,255,255,0.3)]">
          {/* Info header */}
          <div className="bg-gradient-to-b from-gray-300/50 to-gray-300/30 p-2">
            <div className="flex items-center">
              <TbBrandSpotify className="text-green-600 mr-1.5" size={16} />
              <div className="text-gray-700 text-xs font-medium tracking-wide">SPOTIFY</div>
            </div>
            
            {/* Track display with modern styling */}
            <div className="mt-1.5 bg-gray-900/10 rounded-md p-1.5 min-h-[48px] flex items-center">
              {currentTrack ? (
                <div className="flex items-center w-full">
                  {currentTrack.album && currentTrack.album.images && currentTrack.album.images[0] && (
                    <div className="mr-2 relative">
                      <img 
                        src={currentTrack.album.images[0].url} 
                        alt={currentTrack.album.name} 
                        className="w-8 h-8 rounded-md border border-gray-400/20 shadow-sm"
                      />
                      <div className={`absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-gray-800 text-[10px] font-medium tracking-wide truncate">{currentTrack.name}</div>
                    <div className="text-gray-600 text-[10px] truncate">
                      {currentTrack.artists && currentTrack.artists.map(a => a.name).join(', ')}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-full text-center">
                  <div className="text-gray-600 text-[10px] font-medium">No track playing</div>
                </div>
              )}
            </div>
          </div>
          
          {/* Control buttons with modern ExpandableSlider styling */}
          <div className="p-1.5 flex justify-between items-center">
            {/* Mute button */}
            <button
              onClick={toggleMute}
              className={`flex items-center justify-center w-8 h-8 rounded-xl relative
                bg-gradient-to-b from-gray-200/40 to-gray-300/40
                border border-gray-400/20
                backdrop-filter backdrop-blur-[2px]
                shadow-[0_2px_10px_rgba(0,0,0,0.08),inset_0_1px_1px_rgba(255,255,255,0.3)]
                transition-all duration-200 active:shadow-inner`}
              aria-label={isMuted ? "Unmute" : "Mute"}
              title={isMuted ? "Unmute" : "Mute"}
            >
              <VolumeIcon size={16} className={isMuted ? 'text-gray-400' : 'text-gray-700'} />
              <div className={`absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full ${getLedColor()}`}></div>
            </button>
            
            {/* Play/Pause button */}
            <button
              onClick={togglePlayback}
              disabled={!currentTrack}
              className={`flex items-center justify-center w-10 h-10 rounded-xl
                ${!currentTrack ? 'opacity-50 cursor-not-allowed' : ''}
                bg-gradient-to-b ${isPlaying ? 'from-green-400/50 to-green-500/40' : 'from-gray-200/40 to-gray-300/40'}
                border border-gray-400/20
                backdrop-filter backdrop-blur-[2px]
                shadow-[0_2px_10px_rgba(0,0,0,0.08),inset_0_1px_1px_rgba(255,255,255,0.3)]
                transition-all duration-200 active:shadow-inner`}
              aria-label={isPlaying ? "Pause" : "Play"}
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <TbPlayerPause size={20} className="text-gray-800" />
              ) : (
                <TbPlayerPlay size={20} className="text-gray-800" />
              )}
            </button>
            
            {/* Volume value display */}
            <div className="w-8 h-8 flex items-center justify-center rounded-xl 
                           bg-gradient-to-b from-gray-200/30 to-gray-300/30
                           border border-gray-400/20
                           backdrop-filter backdrop-blur-[2px]">
              <span className="font-medium text-[10px] text-gray-700">{volume}%</span>
            </div>
          </div>
        </div>
        
        {/* Volume control knob */}
        <div className="w-16 mx-auto md:mx-0">
          <ExpandableSlider 
            icon={VolumeIcon}
            label="Volume"
            initialValue={volume}
            min={0}
            max={100}
            onChange={handleVolumeChange}
            activeColor="green-500"
            className="aspect-square rounded-xl"
          />
        </div>
      </div>
    </div>
  );
};

export default SpotifyVolumeControl; 