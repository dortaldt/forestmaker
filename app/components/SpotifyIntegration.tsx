'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { initializeSpotify, getSpotifyClient, SpotifyPlaylist, SpotifyTrack } from '../utils/spotifyClient';
import { TbBrandSpotify, TbMusic, TbPlayerPlay, TbPlayerPause, TbLogin, TbLogout, 
  TbSearch, TbVolume, TbVolume2, TbVolume3, TbVolumeOff, TbArrowsShuffle, 
  TbRepeat, TbPlayerSkipBack, TbPlayerSkipForward, TbX, TbHeart, TbHeartFilled } from 'react-icons/tb';
import SpotifyDebug from './SpotifyDebug';

interface SpotifyIntegrationProps {
  clientId: string;
  clientSecret: string;
  isVisible: boolean;
}

const SpotifyIntegration: React.FC<SpotifyIntegrationProps> = ({ clientId, clientSecret, isVisible }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null);
  const [tracks, setTracks] = useState<SpotifyTrack[]>([]);
  const [filteredTracks, setFilteredTracks] = useState<SpotifyTrack[]>([]);
  const [currentTrack, setCurrentTrack] = useState<SpotifyTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [previousVolume, setPreviousVolume] = useState(80);
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState(0); // 0: off, 1: repeat all, 2: repeat one
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [activeView, setActiveView] = useState<'playlists' | 'tracks' | 'search' | 'favorites'>('playlists');
  const volumeSliderRef = useRef<HTMLInputElement>(null);

  // Initialize Spotify client with better error handling
  useEffect(() => {
    if (typeof window !== 'undefined' && clientId) {
      try {
        console.log('Initializing Spotify client with client ID:', clientId);
        const redirectUri = `${window.location.origin}/spotify-callback`;
        console.log('Using redirect URI:', redirectUri);
        
        // Initialize the Spotify client
        const client = initializeSpotify(clientId, clientSecret, redirectUri);
        
        if (!client) {
          console.error('Failed to initialize Spotify client');
          return;
        }
        
        // Check if already logged in
        const isLoggedInNow = client.isLoggedIn();
        console.log('Initial login check:', isLoggedInNow);
        setIsLoggedIn(isLoggedInNow);
        
        if (isLoggedInNow) {
          // Start polling for currently playing track
          pollCurrentTrack();
          // Load user data (profile and playlists)
          loadUserData();
        }
        
        // Load favorites from local storage
        const storedFavorites = localStorage.getItem('spotify_favorites');
        if (storedFavorites) {
          try {
            setFavorites(new Set(JSON.parse(storedFavorites)));
          } catch (e) {
            console.error('Failed to parse stored favorites', e);
          }
        }
      } catch (error) {
        console.error('Error initializing Spotify client:', error);
      }
    }
    
    // Set up interval to poll for login status and currently playing track
    const loginCheckInterval = setInterval(() => {
      const client = getSpotifyClient();
      if (client) {
        const loginStatus = client.isLoggedIn();
        console.log('Polling login status:', loginStatus);
        setIsLoggedIn(loginStatus);
        
        if (loginStatus) {
          // If logged in, check currently playing track
          pollCurrentTrack();
        }
      }
    }, 10000); // Check every 10 seconds
    
    return () => clearInterval(loginCheckInterval);
  }, [clientId, clientSecret]);

  // Filter tracks when search query changes
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredTracks(tracks);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = tracks.filter(track => 
        track.name.toLowerCase().includes(query) || 
        track.artists.some(artist => artist.name.toLowerCase().includes(query))
      );
      setFilteredTracks(filtered);
    }
  }, [searchQuery, tracks]);

  // Handle authentication callback
  const handleAuthCallback = async (code: string, state: string) => {
    setLoading(true);
    const client = getSpotifyClient();
    if (client) {
      const success = await client.handleRedirect(code, state);
      if (success) {
        setIsLoggedIn(true);
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
        loadUserData();
      }
    }
    setLoading(false);
  };

  // Check if user is already logged in
  const checkLoginStatus = () => {
    const spotify = getSpotifyClient();
    if (spotify) {
      const loggedIn = spotify.isLoggedIn();
      console.log('Spotify login status check:', loggedIn);
      
      // Log token details
      const accessToken = localStorage.getItem('spotify_access_token');
      const expiresAt = localStorage.getItem('spotify_expires_at');
      if (accessToken && expiresAt) {
        const now = Date.now();
        const expiry = parseInt(expiresAt, 10);
        console.log('Token validity:', {
          hasToken: !!accessToken, 
          expiresAt: new Date(expiry).toISOString(),
          isValid: now < expiry,
          timeRemaining: Math.floor((expiry - now) / 1000) + 's'
        });
      } else {
        console.log('No tokens found in storage');
      }
      
      setIsLoggedIn(loggedIn);
      
      // If logged in, start polling for current track
      if (loggedIn) {
        pollCurrentTrack();
      }
    } else {
      console.log('Spotify client not available');
      setIsLoggedIn(false);
    }
  };

  // Load user data (profile, playlists)
  const loadUserData = async () => {
    setLoading(true);
    const client = getSpotifyClient();
    if (client) {
      // Load user profile
      const userProfile = await client.getCurrentUser();
      if (userProfile) {
        setUser(userProfile);
      }
      
      // Load playlists
      const userPlaylists = await client.getUserPlaylists(50);
      if (userPlaylists) {
        setPlaylists(userPlaylists);
      }
    }
    setLoading(false);
  };

  // Handle login button click
  const handleLogin = () => {
    const client = getSpotifyClient();
    if (client) {
      // Redirect to Spotify authorization page
      window.location.href = client.getAuthUrl();
    }
  };

  // Handle logout button click
  const handleLogout = () => {
    const client = getSpotifyClient();
    if (client) {
      client.logout();
      setIsLoggedIn(false);
      setUser(null);
      setPlaylists([]);
      setTracks([]);
      setCurrentTrack(null);
      setIsPlaying(false);
    }
  };

  // Load tracks when a playlist is selected
  const handlePlaylistSelect = async (playlistId: string) => {
    if (selectedPlaylist === playlistId) return;
    
    setSelectedPlaylist(playlistId);
    setLoading(true);
    setSearchQuery('');
    setActiveView('tracks');
    
    const client = getSpotifyClient();
    if (client) {
      const playlistTracks = await client.getPlaylistTracks(playlistId, 100);
      if (playlistTracks) {
        setTracks(playlistTracks);
        setFilteredTracks(playlistTracks);
      }
    }
    
    setLoading(false);
  };

  // Play a track
  const playTrack = async (track: SpotifyTrack) => {
    const client = getSpotifyClient();
    if (client) {
      const success = await client.play(track.uri);
      if (success) {
        setCurrentTrack(track);
        setIsPlaying(true);
      }
    }
  };

  // Pause playback
  const pausePlayback = async () => {
    const client = getSpotifyClient();
    if (client) {
      const success = await client.pause();
      if (success) {
        setIsPlaying(false);
      }
    }
  };

  // Toggle play/pause
  const togglePlayback = () => {
    if (isPlaying) {
      pausePlayback();
    } else if (currentTrack) {
      playTrack(currentTrack);
    }
  };

  // Skip to next track
  const playNextTrack = () => {
    if (!currentTrack || filteredTracks.length === 0) return;
    
    const currentIndex = filteredTracks.findIndex(t => t.id === currentTrack.id);
    if (currentIndex < 0) return;
    
    let nextIndex;
    if (isShuffled) {
      // Random track, except current
      nextIndex = Math.floor(Math.random() * (filteredTracks.length - 1));
      if (nextIndex >= currentIndex) nextIndex++; // Skip current track
    } else {
      // Next track in sequence
      nextIndex = (currentIndex + 1) % filteredTracks.length;
    }
    
    playTrack(filteredTracks[nextIndex]);
  };

  // Play previous track
  const playPreviousTrack = () => {
    if (!currentTrack || filteredTracks.length === 0) return;
    
    const currentIndex = filteredTracks.findIndex(t => t.id === currentTrack.id);
    if (currentIndex < 0) return;
    
    let prevIndex;
    if (isShuffled) {
      // Random track, except current
      prevIndex = Math.floor(Math.random() * (filteredTracks.length - 1));
      if (prevIndex >= currentIndex) prevIndex++; // Skip current track
    } else {
      // Previous track in sequence
      prevIndex = (currentIndex - 1 + filteredTracks.length) % filteredTracks.length;
    }
    
    playTrack(filteredTracks[prevIndex]);
  };

  // Toggle shuffle mode
  const toggleShuffle = () => {
    setIsShuffled(prev => !prev);
  };

  // Toggle repeat mode
  const toggleRepeat = () => {
    setRepeatMode(prev => (prev + 1) % 3);
  };

  // Handle volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseInt(e.target.value, 10);
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

  // Toggle favorite status for a track
  const toggleFavorite = (trackId: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(trackId)) {
      newFavorites.delete(trackId);
    } else {
      newFavorites.add(trackId);
    }
    setFavorites(newFavorites);
    
    // Save to localStorage
    localStorage.setItem('spotify_favorites', JSON.stringify([...newFavorites]));
  };

  // Get favorite tracks
  const getFavoriteTracks = () => {
    return filteredTracks.filter(track => favorites.has(track.id));
  };

  // Get volume icon based on volume level
  const getVolumeIcon = () => {
    if (isMuted || volume === 0) return TbVolumeOff;
    if (volume < 33) return TbVolume;
    if (volume < 66) return TbVolume2;
    return TbVolume3;
  };
  
  // Render repeat icon based on mode
  const renderRepeatIcon = () => {
    return (
      <TbRepeat 
        size={20} 
        className={`${repeatMode > 0 ? 'text-green-500' : 'text-white/60'}`}
      />
    );
  };

  // Add polling function for current track
  const pollCurrentTrack = useCallback(async () => {
    const spotify = getSpotifyClient();
    if (spotify && spotify.isLoggedIn()) {
      try {
        const track = await spotify.getCurrentlyPlaying();
        if (track) {
          setCurrentTrack(track);
        }
      } catch (error) {
        console.error('Error polling current track:', error);
      }
    }
  }, []);

  if (!isVisible) return null;

  return (
    <div className="spotify-integration p-4 bg-black/60 backdrop-blur-lg rounded-xl border border-green-500/30 shadow-lg max-h-[80vh] overflow-hidden flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <TbBrandSpotify className="text-green-500 mr-2" size={24} />
          <h2 className="text-white text-lg font-bold">Spotify</h2>
        </div>
        
        {isLoggedIn && user && (
          <div className="flex items-center">
            {user.images && user.images[0] && (
              <img 
                src={user.images[0].url} 
                alt={user.display_name} 
                className="w-6 h-6 rounded-full mr-2"
              />
            )}
            <span className="text-white text-xs hidden sm:inline">{user.display_name}</span>
            <button
              onClick={handleLogout}
              className="ml-2 flex items-center text-white/60 hover:text-white text-xs"
              title="Logout"
            >
              <TbLogout size={16} />
            </button>
          </div>
        )}
      </div>
      
      {loading && (
        <div className="flex justify-center my-4">
          <div className="animate-spin h-6 w-6 border-2 border-green-500 rounded-full border-t-transparent"></div>
        </div>
      )}
      
      {!isLoggedIn ? (
        <div className="flex flex-col items-center py-6">
          <p className="text-white text-sm mb-4 text-center">Connect your Spotify account to play music alongside forest sounds</p>
          <button
            onClick={handleLogin}
            className="flex items-center bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-full transition-colors skeuomorphic-button"
          >
            <TbLogin className="mr-2" />
            Connect Spotify
          </button>
          
          {/* Debugging panel - only shown during development */}
          <div className="mt-8 w-full">
            <SpotifyDebug />
          </div>
        </div>
      ) : (
        <div className="flex flex-col flex-grow overflow-hidden">
          {/* Navigation Tabs */}
          <div className="flex mb-3 border-b border-white/10">
            <button
              onClick={() => setActiveView('playlists')}
              className={`px-3 py-1.5 text-xs ${activeView === 'playlists' ? 'text-green-500 border-b-2 border-green-500' : 'text-white/70'}`}
            >
              Playlists
            </button>
            {selectedPlaylist && (
              <button
                onClick={() => setActiveView('tracks')}
                className={`px-3 py-1.5 text-xs ${activeView === 'tracks' ? 'text-green-500 border-b-2 border-green-500' : 'text-white/70'}`}
              >
                Tracks
              </button>
            )}
            <button
              onClick={() => {
                setActiveView('favorites');
                setFilteredTracks(tracks);
              }}
              className={`px-3 py-1.5 text-xs ${activeView === 'favorites' ? 'text-green-500 border-b-2 border-green-500' : 'text-white/70'}`}
            >
              Favorites
            </button>
          </div>
          
          {/* Conditional Content Based on Active View */}
          <div className="overflow-y-auto flex-grow">
            {/* Playlists View */}
            {activeView === 'playlists' && (
              <div className="overflow-y-auto max-h-[300px]">
                <div className="mb-2 relative">
                  <input
                    type="text"
                    placeholder="Search playlists..."
                    className="w-full bg-black/40 text-white border border-white/20 rounded p-2 pl-8 text-sm"
                    onChange={(e) => {
                      const query = e.target.value.toLowerCase();
                      if (query) {
                        const filtered = playlists.filter(playlist => 
                          playlist.name.toLowerCase().includes(query)
                        );
                        setPlaylists(filtered);
                      } else {
                        loadUserData(); // Reload all playlists
                      }
                    }}
                  />
                  <TbSearch className="absolute left-2.5 top-2.5 text-white/60" size={16} />
                </div>
                <div className="space-y-1">
                  {playlists.map((playlist) => (
                    <button
                      key={playlist.id}
                      onClick={() => handlePlaylistSelect(playlist.id)}
                      className={`w-full flex items-center p-2 hover:bg-white/10 transition-colors rounded ${
                        selectedPlaylist === playlist.id ? 'bg-green-900/30 border-l-2 border-l-green-500' : ''
                      }`}
                    >
                      {playlist.images && playlist.images[0] ? (
                        <img 
                          src={playlist.images[0].url} 
                          alt={playlist.name} 
                          className="w-8 h-8 mr-3 rounded"
                        />
                      ) : (
                        <div className="w-8 h-8 mr-3 rounded bg-green-900/30 flex items-center justify-center">
                          <TbMusic className="text-white/60" size={16} />
                        </div>
                      )}
                      <div className="text-left">
                        <div className="text-white text-sm truncate">{playlist.name}</div>
                        <div className="text-white/60 text-xs">{playlist.tracks.total} tracks</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Tracks View */}
            {activeView === 'tracks' && selectedPlaylist && (
              <div>
                <div className="mb-2 relative">
                  <input
                    type="text"
                    placeholder="Search tracks..."
                    className="w-full bg-black/40 text-white border border-white/20 rounded p-2 pl-8 text-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <TbSearch className="absolute left-2.5 top-2.5 text-white/60" size={16} />
                  {searchQuery && (
                    <button 
                      className="absolute right-2.5 top-2.5 text-white/60 hover:text-white"
                      onClick={() => setSearchQuery('')}
                    >
                      <TbX size={16} />
                    </button>
                  )}
                </div>
                <div className="overflow-y-auto max-h-[300px]">
                  {filteredTracks.length > 0 ? (
                    filteredTracks.map((track) => (
                      <div
                        key={track.id}
                        className={`group flex items-center text-left p-2 hover:bg-white/10 transition-colors rounded ${
                          currentTrack?.id === track.id ? 'bg-green-900/30' : ''
                        }`}
                      >
                        <button
                          onClick={() => playTrack(track)}
                          className="flex-grow flex items-center"
                        >
                          <div className="w-8 h-8 mr-3 relative flex-shrink-0">
                            {track.album && track.album.images && track.album.images[0] ? (
                              <img 
                                src={track.album.images[0].url} 
                                alt={track.album.name} 
                                className="w-full h-full rounded"
                              />
                            ) : (
                              <div className="w-full h-full rounded bg-green-900/30 flex items-center justify-center">
                                <TbMusic className="text-white/60" size={16} />
                              </div>
                            )}
                            {currentTrack?.id === track.id && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded">
                                {isPlaying ? (
                                  <TbPlayerPause className="text-green-500" size={16} />
                                ) : (
                                  <TbPlayerPlay className="text-green-500" size={16} />
                                )}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-grow">
                            <div className="text-white text-sm truncate">{track.name}</div>
                            <div className="text-white/60 text-xs truncate">
                              {track.artists.map(a => a.name).join(', ')}
                            </div>
                          </div>
                        </button>
                        <button
                          onClick={() => toggleFavorite(track.id)}
                          className="ml-2 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label={favorites.has(track.id) ? "Remove from favorites" : "Add to favorites"}
                          title={favorites.has(track.id) ? "Remove from favorites" : "Add to favorites"}
                        >
                          {favorites.has(track.id) ? (
                            <TbHeartFilled className="text-green-500" size={16} />
                          ) : (
                            <TbHeart className="text-white/60 hover:text-white" size={16} />
                          )}
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-white/60 text-sm text-center py-6">
                      {searchQuery ? 'No tracks match your search.' : 'No tracks found in this playlist.'}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Favorites View */}
            {activeView === 'favorites' && (
              <div>
                <div className="overflow-y-auto max-h-[300px]">
                  {getFavoriteTracks().length > 0 ? (
                    getFavoriteTracks().map((track) => (
                      <div
                        key={track.id}
                        className={`group flex items-center text-left p-2 hover:bg-white/10 transition-colors rounded ${
                          currentTrack?.id === track.id ? 'bg-green-900/30' : ''
                        }`}
                      >
                        <button
                          onClick={() => playTrack(track)}
                          className="flex-grow flex items-center"
                        >
                          <div className="w-8 h-8 mr-3 relative flex-shrink-0">
                            {track.album && track.album.images && track.album.images[0] ? (
                              <img 
                                src={track.album.images[0].url} 
                                alt={track.album.name} 
                                className="w-full h-full rounded"
                              />
                            ) : (
                              <div className="w-full h-full rounded bg-green-900/30 flex items-center justify-center">
                                <TbMusic className="text-white/60" size={16} />
                              </div>
                            )}
                            {currentTrack?.id === track.id && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded">
                                {isPlaying ? (
                                  <TbPlayerPause className="text-green-500" size={16} />
                                ) : (
                                  <TbPlayerPlay className="text-green-500" size={16} />
                                )}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-grow">
                            <div className="text-white text-sm truncate">{track.name}</div>
                            <div className="text-white/60 text-xs truncate">
                              {track.artists.map(a => a.name).join(', ')}
                            </div>
                          </div>
                        </button>
                        <button
                          onClick={() => toggleFavorite(track.id)}
                          className="ml-2 p-1.5"
                          aria-label="Remove from favorites"
                          title="Remove from favorites"
                        >
                          <TbHeartFilled className="text-green-500" size={16} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-white/60 text-sm text-center py-6">
                      No favorite tracks yet. Heart a track to add it to favorites.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Playback controls - fixed at bottom */}
          <div className="border-t border-white/10 pt-3 mt-3">
            {/* Current track info */}
            {currentTrack && (
              <div className="flex items-center mb-2">
                {currentTrack.album && currentTrack.album.images && currentTrack.album.images[0] && (
                  <img 
                    src={currentTrack.album.images[0].url} 
                    alt={currentTrack.album.name} 
                    className="w-10 h-10 rounded mr-3"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm font-medium truncate">{currentTrack.name}</div>
                  <div className="text-white/60 text-xs truncate">
                    {currentTrack.artists && currentTrack.artists.map(a => a.name).join(', ')}
                  </div>
                </div>
                <button
                  onClick={() => toggleFavorite(currentTrack.id)}
                  className="ml-2 p-1"
                  aria-label={favorites.has(currentTrack.id) ? "Remove from favorites" : "Add to favorites"}
                  title={favorites.has(currentTrack.id) ? "Remove from favorites" : "Add to favorites"}
                >
                  {favorites.has(currentTrack.id) ? (
                    <TbHeartFilled className="text-green-500" size={16} />
                  ) : (
                    <TbHeart className="text-white/60 hover:text-white" size={16} />
                  )}
                </button>
              </div>
            )}
            
            {/* Playback controls */}
            <div className="flex items-center justify-between">
              {/* Left controls */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={toggleShuffle}
                  className={`${isShuffled ? 'text-green-500' : 'text-white/60 hover:text-white'}`}
                  aria-label={isShuffled ? "Disable shuffle" : "Enable shuffle"}
                  title={isShuffled ? "Disable shuffle" : "Enable shuffle"}
                >
                  <TbArrowsShuffle size={20} />
                </button>
                <button
                  onClick={toggleRepeat}
                  className="text-white/60 hover:text-white"
                  aria-label={repeatMode === 0 ? "Enable repeat" : repeatMode === 1 ? "Enable repeat one" : "Disable repeat"}
                  title={repeatMode === 0 ? "Enable repeat" : repeatMode === 1 ? "Enable repeat one" : "Disable repeat"}
                >
                  {renderRepeatIcon()}
                </button>
              </div>
              
              {/* Center controls */}
              <div className="flex items-center space-x-4">
                <button
                  onClick={playPreviousTrack}
                  className="text-white/60 hover:text-white"
                  aria-label="Previous track"
                  title="Previous track"
                  disabled={!currentTrack}
                >
                  <TbPlayerSkipBack size={22} />
                </button>
                <button
                  onClick={togglePlayback}
                  className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-full transition-colors"
                  aria-label={isPlaying ? "Pause" : "Play"}
                  title={isPlaying ? "Pause" : "Play"}
                  disabled={!currentTrack}
                >
                  {isPlaying ? <TbPlayerPause size={20} /> : <TbPlayerPlay size={20} />}
                </button>
                <button
                  onClick={playNextTrack}
                  className="text-white/60 hover:text-white"
                  aria-label="Next track"
                  title="Next track"
                  disabled={!currentTrack}
                >
                  <TbPlayerSkipForward size={22} />
                </button>
              </div>
              
              {/* Right controls - volume */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={toggleMute}
                  className="text-white/60 hover:text-white"
                  aria-label={isMuted ? "Unmute" : "Mute"}
                  title={isMuted ? "Unmute" : "Mute"}
                >
                  {React.createElement(getVolumeIcon(), { size: 20 })}
                </button>
                <div className="relative w-20 group">
                  <input
                    ref={volumeSliderRef}
                    type="range"
                    min="0"
                    max="100"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="w-full appearance-none h-1 bg-white/20 rounded-full focus:outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-green-500"
                  />
                  <div 
                    className="absolute h-1 bg-green-500 rounded-full top-[9px] left-0 pointer-events-none" 
                    style={{ width: `${volume}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpotifyIntegration; 