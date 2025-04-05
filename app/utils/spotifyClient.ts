// Spotify API client for forestmaker
import { lib as CryptoJSLib } from 'crypto-js';

// Spotify API endpoints
const AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize';
const TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';
const API_BASE = 'https://api.spotify.com/v1';

// Define types for Spotify data
export interface SpotifyTrack {
  id: string;
  name: string;
  uri: string;
  artists: { name: string }[];
  album: {
    name: string;
    images: { url: string }[];
  };
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  images: { url: string }[];
  tracks: {
    total: number;
  };
}

// Generate a random string for the state parameter
const generateRandomString = (length: number): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

// Class to handle Spotify authentication and API calls
export class SpotifyClient {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private expiresAt: number = 0;

  constructor(clientId: string, clientSecret: string, redirectUri: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.redirectUri = redirectUri;
    
    // Try to load tokens from localStorage on initialization
    this.loadTokensFromStorage();
  }

  // Get authorization URL for Spotify login
  getAuthUrl(): string {
    const state = generateRandomString(16);
    const scope = 'user-read-private user-read-email streaming user-read-playback-state user-modify-playback-state';
    
    // Store state in localStorage to verify when redirect returns
    localStorage.setItem('spotify_auth_state', state);
    
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      scope,
      redirect_uri: this.redirectUri,
      state,
    });
    
    return `${AUTH_ENDPOINT}?${params.toString()}`;
  }
  
  // Handle the redirect from Spotify OAuth
  async handleRedirect(code: string, state: string): Promise<boolean> {
    // Verify state matches what we stored
    const storedState = localStorage.getItem('spotify_auth_state');
    if (state !== storedState) {
      console.error('State mismatch in OAuth redirect');
      console.error(`Received state: ${state}, Stored state: ${storedState}`);
      return false;
    }
    
    // Log the redirect URI for debugging
    console.log('Using redirect URI in token exchange:', this.redirectUri);
    console.log('Current location:', window.location.href);
    
    // Exchange code for tokens
    try {
      // Include client_id and client_secret in Authorization header
      const authHeader = 'Basic ' + btoa(`${this.clientId}:${this.clientSecret}`);
      
      const response = await fetch(TOKEN_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': authHeader
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: this.redirectUri
        }),
      });
      
      // Log response status for debugging
      console.log('Token exchange status:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Token exchange error:', errorText);
        throw new Error(`Failed to exchange code for tokens: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Token received, setting tokens and expiration');
      this.setTokens(data.access_token, data.refresh_token, data.expires_in);
      return true;
    } catch (error) {
      console.error('Error exchanging code for tokens:', error);
      return false;
    }
  }
  
  // Set tokens and expiration time
  private setTokens(accessToken: string, refreshToken: string, expiresIn: number): void {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.expiresAt = Date.now() + expiresIn * 1000;
    
    // Save tokens to localStorage
    localStorage.setItem('spotify_access_token', accessToken);
    localStorage.setItem('spotify_refresh_token', refreshToken);
    localStorage.setItem('spotify_expires_at', this.expiresAt.toString());
  }
  
  // Load tokens from localStorage
  private loadTokensFromStorage(): void {
    if (typeof window === 'undefined') return; // Skip on server-side
    
    const accessToken = localStorage.getItem('spotify_access_token');
    const refreshToken = localStorage.getItem('spotify_refresh_token');
    const expiresAt = localStorage.getItem('spotify_expires_at');
    
    if (accessToken) this.accessToken = accessToken;
    if (refreshToken) this.refreshToken = refreshToken;
    if (expiresAt) {
      this.expiresAt = parseInt(expiresAt, 10);
    }
  }
  
  // Clear tokens from memory and storage
  logout(): void {
    this.accessToken = null;
    this.refreshToken = null;
    this.expiresAt = 0;
    
    localStorage.removeItem('spotify_access_token');
    localStorage.removeItem('spotify_refresh_token');
    localStorage.removeItem('spotify_expires_at');
    localStorage.removeItem('spotify_auth_state');
  }
  
  // Check if the user is logged in and tokens are valid
  isLoggedIn(): boolean {
    // Log the current token state for debugging
    console.log('Checking login state:', {
      hasAccessToken: !!this.accessToken,
      hasExpiry: !!this.expiresAt,
      validToken: !!this.accessToken && this.expiresAt > Date.now(),
      timeRemaining: this.expiresAt ? Math.floor((this.expiresAt - Date.now()) / 1000) + 's' : 'none'
    });
    
    // Return true only if we have a token and it's not expired
    return !!this.accessToken && this.expiresAt > Date.now();
  }
  
  // Refresh the access token if needed
  private async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) return false;
    
    try {
      // Include client_id and client_secret in Authorization header
      const authHeader = 'Basic ' + btoa(`${this.clientId}:${this.clientSecret}`);
      
      const response = await fetch(TOKEN_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': authHeader
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: this.refreshToken
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }
      
      const data = await response.json();
      this.accessToken = data.access_token;
      this.expiresAt = Date.now() + data.expires_in * 1000;
      
      if (this.accessToken) {
        localStorage.setItem('spotify_access_token', this.accessToken);
      }
      localStorage.setItem('spotify_expires_at', this.expiresAt.toString());
      
      // Update refresh token if provided
      if (data.refresh_token) {
        this.refreshToken = data.refresh_token;
        if (this.refreshToken) {
          localStorage.setItem('spotify_refresh_token', this.refreshToken);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return false;
    }
  }
  
  // Get the currently playing track
  async getCurrentlyPlaying(): Promise<SpotifyTrack | null> {
    return this.apiRequest('/me/player/currently-playing');
  }

  // Set volume level (0-100)
  async setVolume(volumePercent: number): Promise<boolean> {
    try {
      // Ensure volume is within valid range
      const volume = Math.max(0, Math.min(100, volumePercent));
      await this.apiRequest('/me/player/volume', 'PUT', null, { volume_percent: volume });
      return true;
    } catch (error) {
      console.error('Failed to set volume:', error);
      return false;
    }
  }

  // Make an authenticated API request to Spotify with query parameters
  async apiRequest<T>(
    endpoint: string, 
    method: string = 'GET', 
    body?: any, 
    queryParams?: Record<string, any>
  ): Promise<T | null> {
    // Ensure we have a valid token
    if (!this.isLoggedIn()) {
      console.log('No valid token for API request, trying to refresh...');
      if (this.refreshToken) {
        const refreshed = await this.refreshAccessToken();
        if (!refreshed) {
          console.error('Token refresh failed');
          return null;
        }
        console.log('Token refresh successful');
      } else {
        console.error('No refresh token available');
        return null;
      }
    }
    
    // Make the request
    try {
      if (!this.accessToken) {
        console.error('No access token available for API request');
        return null;
      }
      
      // Add query parameters if provided
      let url = `${API_BASE}${endpoint}`;
      if (queryParams) {
        const params = new URLSearchParams();
        Object.entries(queryParams).forEach(([key, value]) => {
          params.append(key, value.toString());
        });
        url += `?${params.toString()}`;
      }
      
      console.log(`Making API request to: ${method} ${url}`);
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      
      if (response.status === 401) {
        // Token expired, try to refresh
        console.log('Token expired (401 response), refreshing...');
        const refreshed = await this.refreshAccessToken();
        if (!refreshed) {
          console.error('Failed to refresh token after 401');
          return null;
        }
        
        // Retry the request with the new token
        return this.apiRequest(endpoint, method, body, queryParams);
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API request failed: ${response.status} ${response.statusText}`, errorText);
        return null;
      }
      
      // Some endpoints return empty responses for successful calls
      if (response.status === 204) {
        return {} as T;
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request error:', error);
      return null;
    }
  }
  
  // Get the current user's profile
  async getCurrentUser(): Promise<any | null> {
    return this.apiRequest('/me');
  }
  
  // Get user's playlists
  async getUserPlaylists(limit: number = 20): Promise<SpotifyPlaylist[] | null> {
    const response = await this.apiRequest<{items: SpotifyPlaylist[]}>(`/me/playlists?limit=${limit}`);
    return response?.items || null;
  }
  
  // Get tracks from a playlist
  async getPlaylistTracks(playlistId: string, limit: number = 50): Promise<SpotifyTrack[] | null> {
    const response = await this.apiRequest<{items: {track: SpotifyTrack}[]}>(`/playlists/${playlistId}/tracks?limit=${limit}`);
    return response?.items.map(item => item.track) || null;
  }
  
  // Play a track or playlist
  async play(uri: string): Promise<boolean> {
    try {
      await this.apiRequest('/me/player/play', 'PUT', {
        uris: [uri].filter(Boolean),
      });
      return true;
    } catch (error) {
      console.error('Failed to play track:', error);
      return false;
    }
  }
  
  // Pause playback
  async pause(): Promise<boolean> {
    try {
      await this.apiRequest('/me/player/pause', 'PUT');
      return true;
    } catch (error) {
      console.error('Failed to pause playback:', error);
      return false;
    }
  }
}

// Create and export a singleton instance
let spotifyClient: SpotifyClient | null = null;

export const initializeSpotify = (clientId: string, clientSecret: string, redirectUri: string): SpotifyClient => {
  console.log('Initializing Spotify client with ID:', clientId);
  console.log('Using redirect URI:', redirectUri);
  
  // Always create a new instance to ensure fresh state
  spotifyClient = new SpotifyClient(clientId, clientSecret, redirectUri);
  
  // Log tokens from localStorage
  if (typeof window !== 'undefined') {
    const accessToken = localStorage.getItem('spotify_access_token');
    const expiresAt = localStorage.getItem('spotify_expires_at');
    
    console.log('On init - Access token exists:', !!accessToken);
    if (accessToken && expiresAt) {
      const now = Date.now();
      const expiry = parseInt(expiresAt, 10);
      console.log('On init - Token valid:', now < expiry, 'Expires in:', Math.floor((expiry - now) / 1000) + 's');
    }
  }
  
  return spotifyClient;
};

export const getSpotifyClient = (): SpotifyClient | null => {
  if (!spotifyClient) {
    console.log('Warning: Spotify client accessed before initialization');
  }
  return spotifyClient;
}; 