import React from 'react';

interface BrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ className = '', size = 'md' }) => {
  const sizeMap = {
    sm: 'w-7 h-7 rounded-lg',
    md: 'w-9 h-9 rounded-xl',
    lg: 'w-10 h-10 rounded-xl',
    xl: 'w-12 h-12 rounded-2xl',
  };

  return (
    <img
      src="/favicon.svg"
      alt="StudySphere Logo"
      className={`${sizeMap[size]} object-contain shadow-md shadow-indigo-600/25 shrink-0 select-none ${className}`}
    />
  );
};
