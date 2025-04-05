'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';

// Use dynamic import to ensure client-side only rendering
const SpotifyAuthTest = dynamic(
  () => import('../components/SpotifyAuthTest'),
  { ssr: false }
);

export default function SpotifyTestPage() {
  return (
    <div className="min-h-screen bg-black">
      <Suspense fallback={
        <div className="flex items-center justify-center h-screen text-white">
          <div className="text-center">
            <div className="animate-spin h-10 w-10 border-4 border-green-500 rounded-full border-t-transparent mx-auto mb-4"></div>
            <p>Loading test components...</p>
          </div>
        </div>
      }>
        <SpotifyAuthTest />
      </Suspense>
    </div>
  );
} 