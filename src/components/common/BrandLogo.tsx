import React from 'react';

interface BrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ className = '', size = 'md' }) => {
  const sizeMap = {
    sm: { cls: 'w-7 h-7 rounded-lg', dim: 28 },
    md: { cls: 'w-9 h-9 rounded-xl', dim: 36 },
    lg: { cls: 'w-10 h-10 rounded-xl', dim: 40 },
    xl: { cls: 'w-12 h-12 rounded-2xl', dim: 48 },
  };

  const current = sizeMap[size] || sizeMap.md;

  return (
    <img
      src="/favicon.svg"
      alt="StudySphere Logo"
      width={current.dim}
      height={current.dim}
      className={`${current.cls} object-contain shadow-md shadow-indigo-600/25 shrink-0 select-none ${className}`}
    />
  );
};
