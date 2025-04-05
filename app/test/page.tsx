'use client';

import React, { useEffect, useState } from 'react';
import { initializeSpotify, getSpotifyClient } from '../utils/spotifyClient';
import { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET } from '../utils/env';

export default function SpotifySimpleTest() {
  const [logs, setLogs] = useState<string[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  
  const addLog = (message: string) => {
    console.log(message);
    setLogs(prev => [...prev, message]);
  };
  
  useEffect(() => {
    try {
      addLog('Initializing test...');
      
      // Initialize Spotify client
      const clientId = SPOTIFY_CLIENT_ID;
      const clientSecret = SPOTIFY_CLIENT_SECRET;
      const redirectUri = `${window.location.origin}/spotify-callback`;
      
      addLog(`Using client ID: ${clientId}`);
      addLog(`Using redirect URI: ${redirectUri}`);
      
      const client = initializeSpotify(clientId, clientSecret, redirectUri);
      if (client) {
        addLog('✅ Spotify client initialized successfully');
      } else {
        addLog('❌ Failed to initialize Spotify client');
      }
      
      // Check local storage for tokens
      const accessToken = localStorage.getItem('spotify_access_token');
      const refreshToken = localStorage.getItem('spotify_refresh_token');
      const expiresAt = localStorage.getItem('spotify_expires_at');
      
      addLog(`Access token in storage: ${accessToken ? 'Yes' : 'No'}`);
      addLog(`Refresh token in storage: ${refreshToken ? 'Yes' : 'No'}`);
      
      if (expiresAt) {
        const now = Date.now();
        const expiry = parseInt(expiresAt, 10);
        const isValid = now < expiry;
        addLog(`Token expiry: ${new Date(expiry).toLocaleTimeString()} (${isValid ? 'valid' : 'expired'})`);
      } else {
        addLog('No expiry date in storage');
      }
      
      // Check login status
      const isLoggedIn = client ? client.isLoggedIn() : false;
      addLog(`Client reports logged in: ${isLoggedIn ? 'Yes' : 'No'}`);
      
      // If we're logged in, test the API
      if (isLoggedIn) {
        addLog('Testing API access...');
        client.getCurrentUser().then(user => {
          if (user) {
            addLog(`✅ API test successful! Logged in as: ${user.display_name || user.id}`);
          } else {
            addLog('❌ API test failed - no user data returned');
          }
          setStatus('ready');
        }).catch(err => {
          addLog(`❌ API test error: ${err}`);
          setStatus('error');
        });
      } else {
        setStatus('ready');
      }
    } catch (error) {
      addLog(`❌ Error during test: ${error}`);
      setStatus('error');
    }
  }, []);
  
  const handleLogin = () => {
    const client = getSpotifyClient();
    if (client) {
      const authUrl = client.getAuthUrl();
      addLog(`Redirecting to auth URL: ${authUrl.substring(0, 50)}...`);
      window.location.href = authUrl;
    } else {
      addLog('❌ No Spotify client available for login');
    }
  };
  
  const handleReset = () => {
    addLog('Resetting authentication...');
    localStorage.removeItem('spotify_access_token');
    localStorage.removeItem('spotify_refresh_token');
    localStorage.removeItem('spotify_expires_at');
    localStorage.removeItem('spotify_auth_state');
    window.location.reload();
  };
  
  return (
    <div className="min-h-screen bg-gray-900 p-6 text-white">
      <h1 className="text-2xl font-bold mb-4">Spotify Simple Test</h1>
      
      <div className="flex gap-4 mb-6">
        <button 
          onClick={handleLogin}
          className="px-4 py-2 bg-green-600 rounded hover:bg-green-700 transition-colors"
        >
          Login with Spotify
        </button>
        <button 
          onClick={handleReset}
          className="px-4 py-2 bg-red-600 rounded hover:bg-red-700 transition-colors"
        >
          Reset Auth
        </button>
      </div>
      
      <div className="bg-black p-4 rounded-lg font-mono text-sm h-96 overflow-auto">
        {logs.map((log, i) => (
          <div 
            key={i} 
            className={`mb-1 ${
              log.includes('❌') ? 'text-red-400' : 
              log.includes('✅') ? 'text-green-400' : 
              'text-gray-300'
            }`}
          >
            &gt; {log}
          </div>
        ))}
        
        {status === 'loading' && (
          <div className="flex items-center">
            <div className="animate-pulse w-4 h-4 bg-blue-500 rounded-full mr-2"></div>
            <span className="text-blue-400">Processing...</span>
          </div>
        )}
      </div>
    </div>
  );
} 