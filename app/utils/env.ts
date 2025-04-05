// Environment variables for the app

// Spotify credentials - replace these with your actual credentials from Spotify Developer Dashboard
export const SPOTIFY_CLIENT_ID = 'c8d3564139264003a8f13a9e8adc80ef';
export const SPOTIFY_CLIENT_SECRET = 'c1ce397240374ada80ae1453807801ea'; // Replace with your actual client secret

// Other environment variables can be added here

// Helper function to get the base URL
export const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'http://localhost:3000'; // Fallback for server-side
}; 