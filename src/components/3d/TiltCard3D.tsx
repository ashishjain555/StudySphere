import React, { useRef } from 'react';

interface TiltCard3DProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  maxTilt?: number; // max tilt degrees (default 8)
}

export const TiltCard3D: React.FC<TiltCard3DProps> = ({
  children,
  className = '',
  onClick,
  maxTilt = 8,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);
  const rafId = useRef<number | null>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;

    if (rafId.current) cancelAnimationFrame(rafId.current);

    const clientX = e.clientX;
    const clientY = e.clientY;

    rafId.current = requestAnimationFrame(() => {
      const rect = card.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = -((y - centerY) / centerY) * maxTilt;
      const rotateY = ((x - centerX) / centerX) * maxTilt;

      card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.015, 1.015, 1.015)`;
      if (glareRef.current) {
        glareRef.current.style.opacity = '0.18';
        glareRef.current.style.background = `radial-gradient(circle 220px at ${(x / rect.width) * 100}% ${(y / rect.height) * 100}%, rgba(99, 102, 241, 0.25), rgba(56, 189, 248, 0.12), transparent 70%)`;
      }
    });
  };

  const handleMouseLeave = () => {
    if (rafId.current) cancelAnimationFrame(rafId.current);
    const card = cardRef.current;
    if (card) {
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
    }
    if (glareRef.current) {
      glareRef.current.style.opacity = '0';
    }
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
        transition: 'transform 0.15s ease-out',
        transformStyle: 'preserve-3d',
      }}
      className={`relative group will-change-transform ${className}`}
    >
      {/* Specular 3D Cursor Highlight */}
      <div
        ref={glareRef}
        className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300 z-20 opacity-0"
      />
      {children}
    </div>
  );
};
