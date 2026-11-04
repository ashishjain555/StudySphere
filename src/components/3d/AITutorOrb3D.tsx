import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface AITutorOrb3DProps {
  isThinking?: boolean;
  size?: number;
  className?: string;
}

export const AITutorOrb3D: React.FC<AITutorOrb3DProps> = ({
  isThinking = false,
  size = 52,
  className = '',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [webglOk, setWebglOk] = useState(true);
  const isThinkingRef = useRef(isThinking);

  useEffect(() => {
    isThinkingRef.current = isThinking;
  }, [isThinking]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer;
    let animId: number;

    try {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
      camera.position.z = 6;

      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
      renderer.setSize(size, size);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.innerHTML = '';
      container.appendChild(renderer.domElement);

      // Inner Core Mesh
      const coreGeo = new THREE.IcosahedronGeometry(1.0, 1);
      const coreMat = new THREE.MeshBasicMaterial({
        color: 0x6366f1,
        wireframe: true,
      });
      const coreMesh = new THREE.Mesh(coreGeo, coreMat);
      scene.add(coreMesh);

      // Outer Sphere with wireframe
      const outerGeo = new THREE.SphereGeometry(1.5, 16, 16);
      const outerMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        wireframe: true,
        transparent: true,
        opacity: 0.4,
      });
      const outerMesh = new THREE.Mesh(outerGeo, outerMat);
      scene.add(outerMesh);

      // Quantum Ring
      const ringGeo = new THREE.TorusGeometry(1.8, 0.03, 8, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xc084fc,
        transparent: true,
        opacity: 0.75,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2.5;
      scene.add(ring);

      let clock = new THREE.Clock();

      const render = () => {
        animId = requestAnimationFrame(render);
        const t = clock.getElapsedTime();
        const active = isThinkingRef.current;

        const speedMultiplier = active ? 3.0 : 1.0;

        coreMesh.rotation.x = t * 0.5 * speedMultiplier;
        coreMesh.rotation.y = t * 0.7 * speedMultiplier;

        outerMesh.rotation.y = -t * 0.3 * speedMultiplier;
        outerMesh.rotation.z = t * 0.2 * speedMultiplier;

        ring.rotation.z = t * 0.8 * speedMultiplier;

        // Dynamic pulse
        const pulse = active
          ? 1 + Math.sin(t * 8) * 0.18
          : 1 + Math.sin(t * 2.5) * 0.05;
        coreMesh.scale.setScalar(pulse);

        // Color shift when active
        if (active) {
          coreMat.color.setHex(0xa855f7);
          ringMat.color.setHex(0x38bdf8);
        } else {
          coreMat.color.setHex(0x6366f1);
          ringMat.color.setHex(0xc084fc);
        }

        renderer.render(scene, camera);
      };

      render();

      return () => {
        cancelAnimationFrame(animId);
        renderer.dispose();
        coreGeo.dispose();
        coreMat.dispose();
        outerGeo.dispose();
        outerMat.dispose();
        ringGeo.dispose();
        ringMat.dispose();
        if (container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
      };
    } catch {
      setWebglOk(false);
    }
  }, [size]);

  if (!webglOk) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center ${className}`}
      >
        <div className={`w-3 h-3 rounded-full bg-indigo-400 ${isThinking ? 'animate-ping' : ''}`} />
      </div>
    );
  }

  return (
    <div
      ref={mountRef}
      style={{ width: size, height: size }}
      className={`shrink-0 transition-transform ${isThinking ? 'scale-110 drop-shadow-[0_0_12px_rgba(168,85,247,0.6)]' : ''} ${className}`}
      title={isThinking ? 'StudySphere is processing your query...' : 'AI Tutor Brain Active'}
    />
  );
};
