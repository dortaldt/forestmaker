'use client';

import { IconType } from 'react-icons';
import { ButtonHTMLAttributes, ElementType } from 'react';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: IconType;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  tooltip?: string;
  activeColor?: string;
}

export function IconButton({
  icon: Icon,
  onClick,
  variant = 'primary',
  size = 'md',
  tooltip,
  disabled,
  activeColor = 'blue-600',
  ...rest
}: IconButtonProps) {
  // Base classes with modern glass-like styling
  const baseClasses = 'flex items-center justify-center transition-all duration-200 rounded-full overflow-hidden backdrop-filter backdrop-blur-[2px] shadow-[0_2px_10px_rgba(0,0,0,0.08),inset_0_1px_1px_rgba(255,255,255,0.3)]';
  
  // Modern gradient variant classes
  const variantClasses = {
    primary: `bg-gradient-to-b from-${activeColor}/40 to-${activeColor}/30 border border-${activeColor}/20 text-${activeColor}`,
    secondary: 'bg-gradient-to-b from-gray-200/40 to-gray-300/40 border border-gray-400/20 text-gray-700',
    ghost: 'bg-gradient-to-b from-gray-200/20 to-gray-300/20 border border-gray-400/10 text-gray-600'
  };
  
  // Size classes with Apple-like proportions
  const sizeClasses = {
    sm: 'w-9 h-9',
    md: 'w-11 h-11',
    lg: 'w-13 h-13'
  };
  
  const iconSizes = {
    sm: 18,
    md: 22,
    lg: 26
  };
  
  // Updated disabled state with opacity and blur effect
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed backdrop-blur-[3px]' : 'cursor-pointer hover:shadow-md active:shadow-inner active:scale-95 transition-transform duration-150';
  
  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses}`;
  
  return (
    <button
      className={classes}
      onClick={onClick}
      disabled={disabled}
      title={tooltip}
      aria-label={tooltip}
      {...rest}
    >
      <Icon size={iconSizes[size]} />
    </button>
  );
} 