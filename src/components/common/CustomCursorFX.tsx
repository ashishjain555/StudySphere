import React, { useEffect, useRef, useState } from 'react';

interface ClickRipple {
  id: number;
  x: number;
  y: number;
}

interface SparkleParticle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
}

export const CustomCursorFX: React.FC = () => {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  const [isHovered, setIsHovered] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [ripples, setRipples] = useState<ClickRipple[]>([]);
  const [sparkles, setSparkles] = useState<SparkleParticle[]>([]);
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    // Only enable on devices that have a precise mouse pointer and hover capability
    const media = window.matchMedia('(hover: hover) and (pointer: fine)');
    if (!media.matches) return;
    setIsEnabled(true);

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let ringX = mouseX;
    let ringY = mouseY;
    let glowX = mouseX;
    let glowY = mouseY;

    let animId: number;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      if (dotRef.current) {
        dotRef.current.style.left = `${mouseX}px`;
        dotRef.current.style.top = `${mouseY}px`;
      }

      // Check if mouse is over an interactive element
      const target = e.target as HTMLElement | null;
      if (target) {
        const isInteractive = Boolean(
          target.closest('button') ||
          target.closest('a') ||
          target.closest('input') ||
          target.closest('textarea') ||
          target.closest('select') ||
          target.closest('[role="button"]') ||
          target.closest('.cursor-pointer') ||
          target.closest('.glass-card') ||
          target.closest('.glass-panel')
        );
        setIsHovered(isInteractive);
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      setIsClicking(true);

      const clickX = e.clientX;
      const clickY = e.clientY;

      // 1. Spawn Click Shockwave Ripple
      const rippleId = Date.now() + Math.random();
      setRipples((prev) => [...prev.slice(-3), { id: rippleId, x: clickX, y: clickY }]);

      // 2. Spawn 6 Radial Micro Sparkles
      const newSparkles: SparkleParticle[] = [];
      const sparkColors = ['#38bdf8', '#818cf8', '#a855f7', '#fbbf24', '#34d399', '#ffffff'];

      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI * 2 / 6) * i + (Math.random() - 0.5) * 0.4;
        const speed = 2.8 + Math.random() * 3.5;
        newSparkles.push({
          id: rippleId + i,
          x: clickX,
          y: clickY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: sparkColors[i % sparkColors.length],
        });
      }

      setSparkles((prev) => [...prev.slice(-10), ...newSparkles]);

      setTimeout(() => {
        setRipples((prev) => (Array.isArray(prev) ? prev : []).filter((r) => r && r.id !== rippleId));
      }, 550);

      setTimeout(() => {
        setSparkles((prev) => (Array.isArray(prev) ? prev : []).filter((s) => s && !newSparkles.some((ns) => ns.id === s.id)));
      }, 450);
    };

    const handleMouseUp = () => {
      setIsClicking(false);
    };

    // Smooth RAF animation loop for trailing ring and ambient surface spotlight
    const renderLoop = () => {
      animId = requestAnimationFrame(renderLoop);

      // Smooth lerp damping for trailing ring
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;

      if (ringRef.current) {
        ringRef.current.style.left = `${ringX}px`;
        ringRef.current.style.top = `${ringY}px`;
      }

      // Slower lerp for ambient surface spotlight
      glowX += (mouseX - glowX) * 0.08;
      glowY += (mouseY - glowY) * 0.08;

      if (glowRef.current) {
        glowRef.current.style.left = `${glowX}px`;
        glowRef.current.style.top = `${glowY}px`;
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    renderLoop();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      cancelAnimationFrame(animId);
    };
  }, []);

  if (!isEnabled) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden select-none" aria-hidden="true">
      {/* 1. Ambient Surface Spotlight that illuminates dark panels under the cursor */}
      <div
        ref={glowRef}
        className="fixed -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] rounded-full pointer-events-none will-change-transform opacity-30 transition-opacity duration-300"
        style={{
          background: 'radial-gradient(circle, rgba(56, 189, 248, 0.12) 0%, rgba(99, 102, 241, 0.05) 50%, transparent 70%)',
        }}
      />

      {/* 2. Trailing Smooth Outer Ring (Morphs and expands magnetically on hover) */}
      <div
        ref={ringRef}
        className={`fixed -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none will-change-transform transition-all duration-200 ease-out flex items-center justify-center ${
          isClicking
            ? 'w-7 h-7 border-2 border-cyan-400 bg-cyan-400/25 shadow-[0_0_16px_rgba(56,189,248,0.7)] scale-90'
            : isHovered
            ? 'w-12 h-12 border border-blue-400/70 bg-blue-500/10 shadow-[0_0_20px_rgba(96,165,250,0.4)] backdrop-blur-[0.5px] scale-110'
            : 'w-8 h-8 border border-cyan-400/35 bg-cyan-500/[0.03] shadow-[0_0_10px_rgba(56,189,248,0.15)]'
        }`}
      />

      {/* 3. Razor-Sharp Luminous Center Dot */}
      <div
        ref={dotRef}
        className={`fixed -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none will-change-transform transition-all duration-150 ease-out ${
          isClicking
            ? 'w-1.5 h-1.5 bg-cyan-300 shadow-[0_0_12px_#38bdf8] scale-75'
            : isHovered
            ? 'w-2 h-2 bg-white shadow-[0_0_10px_#60a5fa] scale-125'
            : 'w-1.5 h-1.5 bg-cyan-400 shadow-[0_0_8px_#38bdf8]'
        }`}
      />

      {/* 4. Click Shockwave Ripples */}
      {ripples.map((ripple) => (
        <div
          key={ripple.id}
          className="fixed -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border-2 border-cyan-400/80 pointer-events-none will-change-transform animate-clickRipple"
          style={{
            left: `${ripple.x}px`,
            top: `${ripple.y}px`,
          }}
        />
      ))}

      {/* 5. Click Radial Micro-Sparkles */}
      {sparkles.map((spark) => (
        <div
          key={spark.id}
          className="fixed -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full pointer-events-none will-change-transform animate-sparkleBurst"
          style={{
            left: `${spark.x}px`,
            top: `${spark.y}px`,
            backgroundColor: spark.color,
            boxShadow: `0 0 8px ${spark.color}`,
            '--spark-vx': `${spark.vx * 16}px`,
            '--spark-vy': `${spark.vy * 16}px`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
};
