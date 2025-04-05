'use client';

import React, { useState } from 'react';
import ExpandableSlider from '../../components/ExpandableSlider';
import { TbVolume, TbWind, TbDroplet } from 'react-icons/tb';

export default function ExpandableSliderTestPage() {
  const [value, setValue] = useState(50);

  const handleChange = (newValue: number) => {
    setValue(newValue);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-6">Expandable Slider Test</h1>
        
        <div className="flex gap-6 mb-8">
          <div className="w-1/3">
            <h2 className="text-sm mb-2 font-medium">Wind</h2>
            <ExpandableSlider 
              icon={TbWind}
              label="Wind"
              initialValue={value} 
              onChange={handleChange} 
              className="w-20 aspect-square"
              activeColor="orange-400"
            />
          </div>
          
          <div className="w-1/3">
            <h2 className="text-sm mb-2 font-medium">Volume</h2>
            <ExpandableSlider 
              icon={TbVolume}
              label="Volume"
              initialValue={75} 
              className="w-20 aspect-square"
              activeColor="green-500"
            />
          </div>
          
          <div className="w-1/3">
            <h2 className="text-sm mb-2 font-medium">Rain</h2>
            <ExpandableSlider 
              icon={TbDroplet}
              label="Rain"
              initialValue={25} 
              className="w-20 aspect-square"
              disabled={true}
            />
          </div>
        </div>
        
        <div className="mb-4">
          <p className="text-sm mb-2 font-medium">Current Value: {value}</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-medium mb-4">Instructions</h2>
          <ul className="list-disc pl-5 space-y-2 text-sm">
            <li>Click on a slider to expand it</li>
            <li>When expanded, drag up/down to change value</li>
            <li>Click again to collapse</li>
            <li>The disabled slider cannot be interacted with</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 