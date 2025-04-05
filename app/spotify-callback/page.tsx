'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSpotifyClient, initializeSpotify } from '../utils/spotifyClient';
import { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET } from '../utils/env';

export default function SpotifyCallback() {
  const router = useRouter();
  const [status, setStatus] = useState('Processing authentication...');
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    console.log(message);
    setLogs(prev => [...prev, message]);
  };

  useEffect(() => {
    const processAuthCode = async () => {
      try {
        addLog('Spotify callback page loaded');
        
        // Get auth parameters from URL
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        
        addLog(`Code present: ${!!code}, State present: ${!!state}`);
        
        if (!code || !state) {
          const errorMsg = 'Authentication parameters missing';
          setError(errorMsg);
          setStatus('Authentication failed: Missing parameters');
          addLog(`Error: ${errorMsg}`);
          return;
        }
        
        // Ensure we have the Spotify client
        const redirectUri = `${window.location.origin}/spotify-callback`;
        
        addLog('Initializing Spotify client');
        const client = initializeSpotify(SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, redirectUri);
        
        if (!client) {
          const errorMsg = 'Spotify client not initialized';
          setError(errorMsg);
          setStatus('Authentication failed: Client unavailable');
          addLog(`Error: ${errorMsg}`);
          return;
        }
        
        // Process the authentication code
        addLog('Processing authentication code...');
        setStatus('Exchanging code for access tokens...');
        
        // Check localStorage for existing state
        const storedState = localStorage.getItem('spotify_auth_state');
        addLog(`Stored state: ${storedState || 'none'}`);
        addLog(`Received state: ${state}`);
        
        const success = await client.handleRedirect(code, state);
        
        if (success) {
          addLog('✅ Authentication successful!');
          setStatus('Authentication successful! Redirecting...');
          
          // Verify token saved properly
          const accessToken = localStorage.getItem('spotify_access_token');
          const refreshToken = localStorage.getItem('spotify_refresh_token');
          const expiresAt = localStorage.getItem('spotify_expires_at');
          
          addLog(`Access token saved: ${!!accessToken}`);
          addLog(`Refresh token saved: ${!!refreshToken}`);
          addLog(`Expiry saved: ${!!expiresAt}`);
          
          // Redirect to home page after successful auth
          setTimeout(() => {
            router.push('/');
          }, 1500);
        } else {
          const errorMsg = 'Failed to authenticate with Spotify';
          setError(errorMsg);
          setStatus('Authentication failed. Please try again.');
          addLog(`Error: ${errorMsg}`);
          
          // Still redirect after a delay
          setTimeout(() => {
            router.push('/');
          }, 3000);
        }
      } catch (err) {
        console.error('Error processing auth code:', err);
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMsg);
        setStatus('An error occurred. Please try again.');
        addLog(`Critical error: ${errorMsg}`);
        
        // Still redirect after a delay
        setTimeout(() => {
          router.push('/');
        }, 3000);
      }
    };
    
    // Process the auth code immediately
    processAuthCode();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black/90">
      <div className="text-center max-w-lg p-6">
        {!error ? (
          <div className="mb-4 animate-spin h-10 w-10 border-4 border-green-500 rounded-full border-t-transparent mx-auto"></div>
        ) : (
          <div className="mb-4 h-10 w-10 text-2xl text-red-500 mx-auto">❌</div>
        )}
        <h1 className="text-white text-xl mb-2">Spotify Authentication</h1>
        <p className="text-white/70">{status}</p>
        {error && (
          <p className="text-red-400 mt-3 text-sm">Error: {error}</p>
        )}
        <p className="text-white/50 text-sm mt-4">
          {!error ? 'Redirecting you back to forestmaker...' : 'Redirecting back to try again...'}
        </p>
        
        {/* Debug log */}
        <div className="mt-4 bg-black/80 p-3 rounded text-left overflow-auto max-h-60 text-xs font-mono">
          {logs.map((log, i) => (
            <div key={i} className={`${log.includes('Error') || log.includes('Critical') ? 'text-red-400' : log.includes('✅') ? 'text-green-400' : 'text-gray-400'}`}>
              &gt; {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 