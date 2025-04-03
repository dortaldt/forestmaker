'use client';

import { IconType } from 'react-icons';
import { ButtonHTMLAttributes, ElementType } from 'react';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: IconType;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  tooltip?: string;
}

export function IconButton({
  icon: Icon,
  onClick,
  variant = 'primary',
  size = 'md',
  tooltip,
  disabled,
  ...rest
}: IconButtonProps) {
  // Calculate classes based on variant and size
  const baseClasses = 'rounded-full flex items-center justify-center transition-colors duration-200';
  
  const variantClasses = {
    primary: 'bg-green-600 hover:bg-green-700 text-white',
    secondary: 'bg-gray-800 hover:bg-gray-700 text-white',
    ghost: 'bg-transparent hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
  };
  
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };
  
  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24
  };
  
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';
  
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