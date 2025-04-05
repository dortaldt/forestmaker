'use client';

import React, { useEffect, useState } from 'react';
import { getSpotifyClient, initializeSpotify } from '../utils/spotifyClient';

/**
 * A dedicated component for testing Spotify authentication
 * This component will show every step of the auth process and help diagnose issues
 */
const SpotifyAuthTest: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const [authUrl, setAuthUrl] = useState<string>('');
  const [clientInitialized, setClientInitialized] = useState<boolean>(false);
  
  // Add a log entry with timestamp
  const addLog = (message: string) => {
    const timestamp = new Date().toISOString().split('T')[1].substring(0, 8);
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev]);
  };
  
  // Initialize Spotify client
  useEffect(() => {
    try {
      addLog('Initializing Spotify client...');
      const clientId = 'c8d3564139264003a8f13a9e8adc80ef'; // Replace with your client ID
      const redirectUri = `${window.location.origin}/spotify-callback`;
      
      addLog(`Client ID: ${clientId}`);
      addLog(`Redirect URI: ${redirectUri}`);
      
      const client = initializeSpotify(clientId, '', redirectUri);
      setClientInitialized(true);
      
      if (client) {
        const url = client.getAuthUrl();
        setAuthUrl(url);
        addLog('Spotify client initialized successfully');
        addLog(`Auth URL: ${url}`);
        
        // Check if already logged in
        const isLoggedIn = client.isLoggedIn();
        addLog(`Already logged in? ${isLoggedIn ? 'Yes' : 'No'}`);
        
        if (isLoggedIn) {
          // Try to get user info
          client.getCurrentUser().then(user => {
            if (user) {
              addLog(`Logged in as: ${user.display_name || user.id}`);
            } else {
              addLog('Failed to get user info despite isLoggedIn being true');
            }
          });
        }
      }
    } catch (error) {
      addLog(`Error initializing Spotify client: ${error}`);
    }
  }, []);
  
  // Check for Spotify auth code in URL
  useEffect(() => {
    if (!clientInitialized) return;
    
    const checkUrlForCode = async () => {
      try {
        addLog('Checking URL for Spotify auth code...');
        
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        
        if (code && state) {
          addLog(`Found code in URL: ${code.substring(0, 10)}...`);
          addLog(`State: ${state}`);
          
          // Clear URL params to avoid reprocessing on refresh
          window.history.replaceState({}, document.title, window.location.pathname);
          
          // Get client and process code
          const client = getSpotifyClient();
          if (client) {
            addLog('Processing auth code with handleRedirect...');
            const success = await client.handleRedirect(code, state);
            
            if (success) {
              addLog('✅ Successfully authenticated with Spotify!');
              
              // Get user info
              const user = await client.getCurrentUser();
              if (user) {
                addLog(`Logged in as: ${user.display_name || user.id}`);
              }
              
              // Verify login state
              const isLoggedIn = client.isLoggedIn();
              addLog(`isLoggedIn() reports: ${isLoggedIn ? 'true' : 'false'}`);
              
              // Check localStorage
              addLog('LocalStorage after auth:');
              ['spotify_access_token', 'spotify_refresh_token', 'spotify_expires_at'].forEach(key => {
                const value = localStorage.getItem(key);
                addLog(`- ${key}: ${value ? 'present' : 'missing'}`);
              });
            } else {
              addLog('❌ Failed to process auth code');
            }
          } else {
            addLog('❌ Spotify client not available');
          }
        } else {
          addLog('No Spotify auth code found in URL');
        }
      } catch (error) {
        addLog(`Error processing Spotify auth: ${error}`);
      }
    };
    
    checkUrlForCode();
  }, [clientInitialized]);
  
  // Extract tokens from localStorage for display
  const getTokensInfo = () => {
    const tokens: Record<string, string> = {};
    
    ['spotify_access_token', 'spotify_refresh_token', 'spotify_expires_at'].forEach(key => {
      const value = localStorage.getItem(key);
      if (value) {
        if (key === 'spotify_expires_at') {
          const expiresAt = parseInt(value);
          const now = Date.now();
          const isValid = expiresAt > now;
          const expiresIn = Math.floor((expiresAt - now) / 1000);
          
          tokens[key] = `${new Date(expiresAt).toLocaleTimeString()} (${isValid ? 'valid' : 'expired'}, ${expiresIn}s remaining)`;
        } else {
          tokens[key] = `${value.substring(0, 10)}...`;
        }
      } else {
        tokens[key] = 'missing';
      }
    });
    
    return tokens;
  };
  
  // Handle login button click
  const handleLogin = () => {
    addLog('Login button clicked');
    const client = getSpotifyClient();
    
    if (client) {
      addLog('Redirecting to Spotify login...');
      window.location.href = authUrl;
    } else {
      addLog('❌ Spotify client not available for login');
    }
  };
  
  // Handle logout
  const handleLogout = () => {
    addLog('Logout button clicked');
    const client = getSpotifyClient();
    
    if (client) {
      client.logout();
      addLog('Logged out, cleared all tokens');
      window.location.reload();
    }
  };
  
  // Handle connection test
  const testConnection = async () => {
    addLog('Testing connection...');
    const client = getSpotifyClient();
    
    if (client) {
      if (client.isLoggedIn()) {
        addLog('Client reports as logged in, fetching user info...');
        
        try {
          const user = await client.getCurrentUser();
          if (user) {
            addLog(`✅ Successfully connected! User: ${user.display_name || user.id}`);
          } else {
            addLog('❌ Failed to get user info despite isLoggedIn being true');
          }
        } catch (error) {
          addLog(`❌ Error testing connection: ${error}`);
        }
      } else {
        addLog('❌ Not logged in according to client.isLoggedIn()');
      }
    } else {
      addLog('❌ Spotify client not available');
    }
  };
  
  // Get current login status
  const isLoggedIn = () => {
    const client = getSpotifyClient();
    return client ? client.isLoggedIn() : false;
  };
  
  const tokensInfo = getTokensInfo();
  
  return (
    <div className="bg-gray-900 p-6 rounded-lg shadow-lg max-w-3xl mx-auto my-8 text-white">
      <h1 className="text-2xl font-bold mb-4 flex items-center">
        <span className="text-green-500 mr-2">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.52 17.34c-.24.36-.66.48-1.02.24-2.82-1.74-6.36-2.1-10.56-1.14-.42.12-.78-.18-.9-.54-.12-.42.18-.78.54-.9 4.56-1.02 8.52-.6 11.64 1.32.42.18.48.66.3 1.02zm1.44-3.3c-.3.42-.84.6-1.26.3-3.24-1.98-8.16-2.58-11.94-1.42-.48.12-.96-.18-1.08-.66-.12-.48.18-.96.66-1.08 4.38-1.32 9.78-.66 13.5 1.62.36.24.54.78.24 1.2l-.12.04zm.12-3.36c-3.84-2.28-10.2-2.5-13.86-1.38-.6.12-1.2-.24-1.32-.84-.12-.6.24-1.2.84-1.32 4.26-1.26 11.28-1.02 15.72 1.62.54.3.72 1.02.42 1.56-.3.42-1.02.66-1.8.36z" />
          </svg>
        </span>
        Spotify Auth Test
      </h1>
      
      <div className="flex gap-4 mb-6">
        <button 
          onClick={handleLogin}
          disabled={isLoggedIn()}
          className={`px-4 py-2 rounded-full ${isLoggedIn() ? 'bg-gray-700 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'} transition-colors`}
        >
          {isLoggedIn() ? 'Already Logged In' : 'Login with Spotify'}
        </button>
        
        <button 
          onClick={handleLogout}
          disabled={!isLoggedIn()}
          className={`px-4 py-2 rounded-full ${!isLoggedIn() ? 'bg-gray-700 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'} transition-colors`}
        >
          Logout
        </button>
        
        <button 
          onClick={testConnection}
          className="px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 transition-colors"
        >
          Test Connection
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-800 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Status</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Client Initialized:</span>
              <span className={clientInitialized ? "text-green-500" : "text-red-500"}>
                {clientInitialized ? "Yes" : "No"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Logged In:</span>
              <span className={isLoggedIn() ? "text-green-500" : "text-red-500"}>
                {isLoggedIn() ? "Yes" : "No"}
              </span>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Tokens</h2>
          <div className="space-y-2 text-sm">
            {Object.entries(tokensInfo).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className="text-gray-300">{key}:</span>
                <span className={value === 'missing' ? "text-red-500" : "text-green-500"}>
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="bg-black/50 p-4 rounded h-80 overflow-auto">
        <h2 className="text-lg font-semibold mb-2">Debug Log</h2>
        <div className="space-y-1 font-mono text-xs">
          {logs.map((log, index) => (
            <div key={index} className={log.includes('❌') ? "text-red-400" : log.includes('✅') ? "text-green-400" : "text-gray-300"}>
              {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SpotifyAuthTest; 