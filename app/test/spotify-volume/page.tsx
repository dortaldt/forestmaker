'use client';

import React from 'react';
import SpotifyVolumeControl from '../../components/SpotifyVolumeControl';
import ExpandableSlider from '../../components/ExpandableSlider';

export default function SpotifyVolumeTestPage() {
  return (
    <div className="min-h-screen bg-gray-800 p-8">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-white">Spotify Volume Control Test</h1>
        
        <div className="mb-8">
          <h2 className="text-lg font-medium mb-4 text-white">Standard Spotify Control</h2>
          <SpotifyVolumeControl />
        </div>
        
        <div className="bg-black/50 p-6 rounded-xl mb-8">
          <h2 className="text-lg font-medium mb-4 text-white">Individual Sliders Demo</h2>
          <div className="flex gap-6 justify-center">
            <div className="text-center">
              <h3 className="text-sm mb-2 font-medium text-white">Default</h3>
              <ExpandableSlider 
                initialValue={50} 
                className="w-20 mx-auto"
              />
            </div>
            
            <div className="text-center">
              <h3 className="text-sm mb-2 font-medium text-white">Blue/Active</h3>
              <ExpandableSlider 
                initialValue={75} 
                className="w-20 mx-auto"
              />
            </div>
            
            <div className="text-center">
              <h3 className="text-sm mb-2 font-medium text-white">Disabled</h3>
              <ExpandableSlider 
                initialValue={25} 
                className="w-20 mx-auto"
                disabled={true}
              />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-medium mb-4">Instructions</h2>
          <ul className="list-disc pl-5 space-y-2 text-sm">
            <li>Click on the horizontal volume slider in the Spotify control to reveal the expandable slider</li>
            <li>Click on any slider to expand it vertically</li>
            <li>When expanded, drag up/down to change value</li>
            <li>Click again to collapse</li>
          </ul>
        </div>
      </div>
    </div>
  )
} 