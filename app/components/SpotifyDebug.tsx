'use client';

import React, { useEffect, useState } from 'react';
import { getSpotifyClient } from '../utils/spotifyClient';

const SpotifyDebug: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [clientAvailable, setClientAvailable] = useState<boolean>(false);
  const [localStorageData, setLocalStorageData] = useState<Record<string, string>>({});
  
  useEffect(() => {
    // Initial check
    checkSpotifyStatus();
    
    // Poll for status changes every 2 seconds
    const interval = setInterval(() => {
      checkSpotifyStatus();
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);
  
  const checkSpotifyStatus = () => {
    const client = getSpotifyClient();
    setClientAvailable(!!client);
    
    if (client) {
      setIsLoggedIn(client.isLoggedIn());
      setAccessToken(localStorage.getItem('spotify_access_token'));
      setRefreshToken(localStorage.getItem('spotify_refresh_token'));
      const expiresAtStr = localStorage.getItem('spotify_expires_at');
      setExpiresAt(expiresAtStr ? parseInt(expiresAtStr) : null);
    }
    
    // Get all Spotify-related localStorage items
    const storage: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes('spotify')) {
        let value = localStorage.getItem(key) || '';
        // Truncate long tokens for display
        if (value && value.length > 20) {
          value = value.substring(0, 20) + '...';
        }
        storage[key] = value;
      }
    }
    setLocalStorageData(storage);
  };
  
  const resetAuth = () => {
    // Clear all Spotify related items from localStorage
    Object.keys(localStorage).forEach(key => {
      if (key.includes('spotify')) {
        localStorage.removeItem(key);
      }
    });
    // Reload the page to reinitialize everything
    window.location.reload();
  };
  
  const formatTimestamp = (timestamp: number | null) => {
    if (!timestamp) return 'Not set';
    const date = new Date(timestamp);
    return `${date.toLocaleTimeString()} (${timestamp > Date.now() ? 'valid' : 'expired'})`;
  };
  
  // Add a function to test the API access
  const testApiAccess = async () => {
    try {
      const client = getSpotifyClient();
      if (!client) {
        console.error('Client not available for API test');
        return false;
      }
      
      // Try to fetch current user as a test
      const user = await client.getCurrentUser();
      return !!user;
    } catch (error) {
      console.error('API access test failed:', error);
      return false;
    }
  };
  
  return (
    <div className="bg-gray-800 p-4 rounded-md mt-4 text-sm">
      <h3 className="text-white font-bold mb-2">Spotify Debug Panel</h3>
      
      {!clientAvailable ? (
        <div className="text-red-400">
          Spotify client not initialized!
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex flex-col">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Login Status:</span>
              <span className={isLoggedIn ? "text-green-400" : "text-red-400"}>
                {isLoggedIn ? "Logged In" : "Not Logged In"}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Token Valid Until:</span>
              <span className={expiresAt && expiresAt > Date.now() ? "text-green-400" : "text-red-400"}>
                {formatTimestamp(expiresAt)}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Access Token:</span>
              <span className="text-green-400">
                {accessToken ? "Present" : "Missing"}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Refresh Token:</span>
              <span className="text-green-400">
                {refreshToken ? "Present" : "Missing"}
              </span>
            </div>
          </div>
          
          <div className="mt-2">
            <h4 className="text-white font-semibold mb-1">LocalStorage:</h4>
            <div className="bg-gray-900 p-2 rounded text-xs">
              {Object.entries(localStorageData).length > 0 ? (
                Object.entries(localStorageData).map(([key, value]) => (
                  <div key={key} className="flex justify-between mb-1">
                    <span className="text-blue-300">{key}:</span>
                    <span className="text-gray-300">{value}</span>
                  </div>
                ))
              ) : (
                <span className="text-gray-400">No Spotify data in localStorage</span>
              )}
            </div>
          </div>
          
          <div className="flex justify-end mt-3 space-x-2">
            <button
              onClick={resetAuth}
              className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1 rounded transition-colors"
            >
              Reset Auth
            </button>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 rounded transition-colors"
            >
              Refresh
            </button>
            <button
              onClick={async () => {
                const success = await testApiAccess();
                if (success) {
                  alert('API access test successful!');
                } else {
                  alert('API access test failed. See console for details.');
                }
              }}
              className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 rounded transition-colors"
            >
              Test API
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpotifyDebug; 