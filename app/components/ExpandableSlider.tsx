'use client';

import React, { useState, useRef, useEffect } from 'react';
import { IconType } from 'react-icons';
import { TbVolumeOff } from 'react-icons/tb';

interface ExpandableSliderProps {
  initialValue?: number;
  min?: number;
  max?: number;
  onChange?: (value: number) => void;
  className?: string;
  disabled?: boolean;
  icon?: IconType;
  label?: string;
  activeColor?: string;
  themeColor?: string; // Theme main color based on background image average
  id?: string; // Add ID for tracking active slider
}

// Create a global event name for slider state changes
const SLIDER_EXPANDED_EVENT = 'sliderExpanded';

const ExpandableSlider: React.FC<ExpandableSliderProps> = ({
  initialValue = 50,
  min = 0,
  max = 100,
  onChange,
  className = '',
  disabled = false,
  icon: Icon,
  label,
  activeColor = 'blue-600',
  themeColor = '#f97316', // Default to orange if no theme color provided
  id = 'slider-' + Math.random().toString(36).substring(2, 9), // Generate a random ID if none provided
}) => {
  const [value, setValue] = useState(initialValue);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const expandedHeight = 200; // Height when expanded (increased)
  const collapsedHeight = 80; // Height when collapsed (increased)
  const buttonHeight = collapsedHeight; // Define button height separately
  
  // Calculate current height based on expansion state
  const currentHeight = isExpanded ? expandedHeight : collapsedHeight;

  // Disable body scrolling while dragging
  useEffect(() => {
    if (isDragging) {
      // Save the current body style
      const originalStyle = window.getComputedStyle(document.body).overflow;
      // Prevent scrolling
      document.body.style.overflow = 'hidden';
      
      return () => {
        // Restore scrolling when done dragging
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isDragging]);

  // Listen for other sliders being expanded
  useEffect(() => {
    const handleSliderExpanded = (event: CustomEvent) => {
      const expandedSliderId = event.detail.id;
      
      // Collapse this slider if another one was expanded
      if (expandedSliderId !== id && isExpanded) {
        setIsExpanded(false);
      }
    };

    // Add event listener for slider expanded events
    window.addEventListener(SLIDER_EXPANDED_EVENT, handleSliderExpanded as EventListener);
    
    return () => {
      window.removeEventListener(SLIDER_EXPANDED_EVENT, handleSliderExpanded as EventListener);
    };
  }, [id, isExpanded]);

  // Dispatch event when this slider expands
  useEffect(() => {
    if (isExpanded) {
      const event = new CustomEvent(SLIDER_EXPANDED_EVENT, { 
        detail: { id } 
      });
      window.dispatchEvent(event);
    }
  }, [isExpanded, id]);

  // Handle click to expand/collapse
  const handleClick = () => {
    if (!disabled) {
      // If slider is off (value is 0), set it to 50% when clicked
      if (value === 0) {
        const defaultValue = Math.round(min + (max - min) * 0.5); // 50% between min and max
        setValue(defaultValue);
        onChange?.(defaultValue);
      }
      setIsExpanded(!isExpanded);
    }
  };

  // Start dragging
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (disabled || !isExpanded) return;
    
    e.preventDefault();
    setIsDragging(true);
    
    // If it's a touch event, immediately handle the drag with the initial touch position
    if ('touches' in e && e.touches[0]) {
      handleDrag(e.touches[0].clientY);
    } else if ('clientY' in e) {
      handleDrag(e.clientY);
    }
  };

  // Handle dragging
  const handleDrag = (clientY: number) => {
    if (!isDragging || !sliderRef.current) return;
    
    const sliderRect = sliderRef.current.getBoundingClientRect();
    const sliderTotalHeight = sliderRect.height;
    
    // Calculate position relative to the top of the slider (including button area)
    const offsetY = clientY - sliderRect.top;
    
    // Constrain to entire slider area
    const maxY = sliderTotalHeight;
    const minY = 0;
    const constrainedY = Math.max(minY, Math.min(maxY, offsetY));
    
    // Calculate percentage (0% at bottom, 100% at top)
    const percentage = 1 - constrainedY / maxY;
    const newValue = Math.round(min + percentage * (max - min));
    
    setValue(newValue);
    onChange?.(newValue);
  };

  // Handle mouse move with smoother animation
  useEffect(() => {
    let animationFrameId: number | null = null;
    
    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      
      // Use requestAnimationFrame for smoother updates
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      
      animationFrameId = requestAnimationFrame(() => {
        handleDrag(e.clientY);
      });
    };
    
    const handleMouseUp = () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
      setIsDragging(false);
    };
    
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove, { passive: false });
      window.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Handle touch move
  useEffect(() => {
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches[0]) {
        handleDrag(e.touches[0].clientY);
      }
    };
    
    const handleTouchEnd = () => {
      setIsDragging(false);
    };
    
    if (isDragging) {
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleTouchEnd);
      // Add touchcancel to handle cases where the touch is interrupted
      window.addEventListener('touchcancel', handleTouchEnd);
    }
    
    return () => {
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [isDragging]);

  // Get the appropriate color classes based on component state and value
  const getActiveTextColor = () => {
    if (disabled) return 'text-gray-400';
    return value > 0 ? 'text-theme-color' : 'text-gray-400';
  };
  
  // Get the style for themed elements
  const getThemeColorStyle = () => {
    return value > 0 ? { color: themeColor } : {};
  };

  // Determine which color LED indicator to show
  const getLedColor = () => {
    if (disabled) return 'bg-gray-300';
    if (value <= 0) return 'bg-gray-400';
    
    // Use the theme color with different opacities based on value
    const opacity = Math.min(0.6 + (value / max) * 0.4, 1);
    const opacityPercent = Math.round(opacity * 100);
    return `bg-[${themeColor}${opacityPercent}]`;
  };

  return (
    <div 
      ref={buttonRef}
      className={`relative mx-auto ${className}`}
      style={{ 
        aspectRatio: '1/1',
        height: collapsedHeight,
        width: collapsedHeight,
      }}
    >
      {/* Expanded slider container - this is the continuous background that grows from the button */}
      <div 
        className={`absolute left-1/2 bottom-0 -translate-x-1/2 transition-all duration-300 ease-in-out 
          rounded-xl overflow-visible
          backdrop-filter ${value > 0 ? 'backdrop-blur-[2px]' : 'backdrop-blur-[3px]'}
          shadow-[0_2px_10px_rgba(0,0,0,0.08),inset_0_1px_1px_rgba(255,255,255,0.3)]`}
        style={{ 
          width: '100%',
          height: isExpanded ? expandedHeight : collapsedHeight,
          zIndex: isExpanded ? 9 : 1, // Lower z-index for the container
          transform: 'translateX(-50%)',
          opacity: 1,
          borderRadius: '0.75rem',
          background: value > 0 
            ? `linear-gradient(to bottom, ${themeColor}20, ${themeColor}30)` 
            : `linear-gradient(to bottom, rgba(229, 231, 235, 0.2), rgba(209, 213, 219, 0.2))`,
          border: value > 0 
            ? `1px solid ${themeColor}40` 
            : '1px solid rgba(156, 163, 175, 0.1)'
        }}
        ref={sliderRef}
        onClick={handleClick}
        onMouseDown={isExpanded ? handleDragStart : undefined}
        onTouchStart={isExpanded ? handleDragStart : undefined}
      >
        {/* Volume indicator border - appears on the border of the button */}
        {!isExpanded && value > 0 && (
          <div 
            className="absolute inset-0 pointer-events-none transition-all duration-200"
            style={{
              borderRadius: '0.75rem',
              background: 'transparent',
              border: '2px solid transparent',
              backgroundImage: `conic-gradient(
                ${themeColor} 0deg ${(value / max) * 360}deg,
                rgba(255, 255, 255, 0.5) ${(value / max) * 360}deg 360deg
              )`,
              backgroundOrigin: 'border-box',
              backgroundClip: 'border-box',
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
              zIndex: 25
            }}
          />
        )}
        
        {/* Track area - only visible when expanded */}
        {isExpanded && (
          <div className="absolute inset-x-0 top-0 bottom-0 bg-transparent" />
        )}
        
        {/* Fill area - enhanced contrast and visibility */}
        {isExpanded && (
          <div 
            className={`absolute inset-x-0 bottom-0
              rounded-xl
              transition-all duration-100 ease-out pointer-events-none
              shadow-[0_0_10px_rgba(0,0,0,0.15)]`}
            style={{ 
              height: `${((value - min) / (max - min)) * expandedHeight}px`,
              maxHeight: `${expandedHeight}px`,
              background: `linear-gradient(to top, ${themeColor}, ${themeColor}CC)`,
              zIndex: 10,
              willChange: 'height, transform',
              transform: isDragging ? 'scale(1.005)' : 'scale(1)',
              borderRadius: '0.75rem',
              overflow: 'hidden'
            }}
          />
        )}

        {/* Track markings/scales - enhanced visibility when expanded */}
        {isExpanded && (
          <div className="absolute inset-x-4 top-0 bottom-0 flex flex-col justify-between py-6 z-5 pointer-events-none">
            {[...Array(5)].map((_, i) => (
              <div 
                key={`mark-${i}`} 
                className="w-full flex items-center"
              >
                <div 
                  className="w-2 h-0.5"
                  style={{ backgroundColor: `${themeColor}60` }}
                ></div>
                <div 
                  className="flex-grow h-[1.5px]"
                  style={{ backgroundColor: `${themeColor}40` }}
                ></div>
                <div 
                  className="w-2 h-0.5"
                  style={{ backgroundColor: `${themeColor}60` }}
                ></div>
              </div>
            ))}
          </div>
        )}

        {/* Button/handle at bottom - draggable when expanded */}
        <div 
          className={`absolute bottom-0 left-0 right-0 flex flex-col items-center justify-center
            ${isExpanded ? 'rounded-b-xl rounded-t-none' : 'rounded-xl'}
            border-t ${isExpanded ? 'border-t-gray-400/30' : 'border-t-transparent'}`}
          style={{ 
            height: buttonHeight,
            zIndex: 20,
            transform: 'scale(1)',
            borderRadius: isExpanded ? '0 0 0.75rem 0.75rem' : '0.75rem',
          }}
          onClick={handleClick}
        >
          <div className="flex flex-col items-center justify-evenly h-full py-2 px-1">
            {/* Icon and label */}
            {Icon && <Icon size={24} className={`transition-colors ${getActiveTextColor()}`} style={getThemeColorStyle()} />}
            
            <div className="flex flex-col items-center">
              {label && <span className="text-[10px] font-medium text-gray-700">{label}</span>}
              {/* Removed percentage display as requested */}
              
              {/* iOS-style volume indicator removed */}
            </div>
          </div>
        </div>
      </div>
      
      {/* Mute button - floating above the slider with glass effect */}
      {isExpanded && value > 0 && (
        <div 
          className="w-10 h-10 rounded-full 
                   flex items-center justify-center cursor-pointer
                   border border-white/20 
                   hover:scale-105 active:scale-95 transition-transform duration-150"
          style={{
            position: 'absolute',
            top: `-172px`,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 999,
            background: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08), inset 0 1px 1px rgba(255, 255, 255, 0.3)'
          }}
          onClick={(e) => {
            e.stopPropagation(); // Prevent triggering parent click events
            setValue(0);
            setIsExpanded(false);
            onChange?.(0); // Notify parent component
          }}
        >
          <TbVolumeOff size={18} style={{ color: themeColor }} />
        </div>
      )}
    </div>
  );
};

export default ExpandableSlider; 