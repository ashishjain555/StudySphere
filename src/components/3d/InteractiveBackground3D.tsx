import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface InteractiveBackground3DProps {
  intensity?: 'subtle' | 'vibrant';
  className?: string;
}

export const InteractiveBackground3D: React.FC<InteractiveBackground3DProps> = ({
  intensity = 'subtle',
  className = '',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let animFrameId: number;
    let renderer: THREE.WebGLRenderer | null = null;

    try {
      const width = container.clientWidth || window.innerWidth;
      const height = container.clientHeight || window.innerHeight;

      const isMobile = (container.clientWidth || window.innerWidth) < 768;
      const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      // 1. Scene & Camera Setup
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
      camera.position.z = 28;

      // 2. High-Performance WebGL Renderer
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: !isMobile,
        powerPreference: 'high-performance',
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(isMobile ? 1.0 : Math.min(window.devicePixelRatio || 1, 1.5));
      container.appendChild(renderer.domElement);

      // 3. Lighting Setup
      const cursorLight = new THREE.PointLight(0x38bdf8, intensity === 'vibrant' ? 3 : 2, 45);
      cursorLight.position.set(0, 0, 18);
      scene.add(cursorLight);

      const secondaryLight = new THREE.PointLight(0xa855f7, intensity === 'vibrant' ? 2.5 : 1.8, 40);
      secondaryLight.position.set(-15, 10, 12);
      scene.add(secondaryLight);

      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      scene.add(ambientLight);

      // 4. Dynamic Particle System (Neural Constellation)
      const particleCount = isMobile ? (intensity === 'vibrant' ? 90 : 60) : (intensity === 'vibrant' ? 220 : 160);
      const posArray = new Float32Array(particleCount * 3);
      const originalPos = new Float32Array(particleCount * 3);
      const colArray = new Float32Array(particleCount * 3);

      const colorPalette = [
        new THREE.Color('#38bdf8'), // Sky Blue
        new THREE.Color('#6366f1'), // Indigo
        new THREE.Color('#a855f7'), // Purple
        new THREE.Color('#34d399'), // Emerald
        new THREE.Color('#06b6d4'), // Cyan
      ];

      for (let i = 0; i < particleCount; i++) {
        const x = (Math.random() - 0.5) * 55;
        const y = (Math.random() - 0.5) * 36;
        const z = (Math.random() - 0.5) * 28;

        posArray[i * 3] = x;
        posArray[i * 3 + 1] = y;
        posArray[i * 3 + 2] = z;

        originalPos[i * 3] = x;
        originalPos[i * 3 + 1] = y;
        originalPos[i * 3 + 2] = z;

        const col = colorPalette[i % colorPalette.length];
        colArray[i * 3] = col.r;
        colArray[i * 3 + 1] = col.g;
        colArray[i * 3 + 2] = col.b;
      }

      const particleGeometry = new THREE.BufferGeometry();
      particleGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
      particleGeometry.setAttribute('color', new THREE.BufferAttribute(colArray, 3));

      // Circular glowing particle texture
      const canvas = document.createElement('canvas');
      canvas.width = 32;
      canvas.height = 32;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
        grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
        grad.addColorStop(0.3, 'rgba(129, 140, 248, 0.8)');
        grad.addColorStop(0.8, 'rgba(56, 189, 248, 0.2)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 32, 32);
      }
      const particleTexture = new THREE.CanvasTexture(canvas);

      const particleMaterial = new THREE.PointsMaterial({
        size: intensity === 'vibrant' ? 0.85 : 0.65,
        map: particleTexture,
        transparent: true,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        opacity: intensity === 'vibrant' ? 0.85 : 0.65,
      });

      const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
      scene.add(particleSystem);

      // 5. Dynamic Synaptic Connections (Lines between nearby particles)
      const maxDistance = 6.2;
      const linePositions: number[] = [];
      for (let i = 0; i < particleCount; i++) {
        for (let j = i + 1; j < particleCount; j++) {
          const dx = posArray[i * 3] - posArray[j * 3];
          const dy = posArray[i * 3 + 1] - posArray[j * 3 + 1];
          const dz = posArray[i * 3 + 2] - posArray[j * 3 + 2];
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
          if (dist < maxDistance) {
            linePositions.push(
              posArray[i * 3], posArray[i * 3 + 1], posArray[i * 3 + 2],
              posArray[j * 3], posArray[j * 3 + 1], posArray[j * 3 + 2]
            );
          }
        }
      }

      const lineGeometry = new THREE.BufferGeometry();
      lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));

      const lineMaterial = new THREE.LineBasicMaterial({
        color: 0x6366f1,
        transparent: true,
        opacity: intensity === 'vibrant' ? 0.22 : 0.14,
        blending: THREE.AdditiveBlending,
      });

      const lineSegments = new THREE.LineSegments(lineGeometry, lineMaterial);
      scene.add(lineSegments);

      // 6. Floating Ambient Geometric 3D Wireframes (Floating AI Cores)
      // Floating Icosahedron
      const icoGeo = new THREE.IcosahedronGeometry(4.2, 1);
      const icoMat = new THREE.MeshBasicMaterial({
        color: 0x818cf8,
        wireframe: true,
        transparent: true,
        opacity: 0.16,
      });
      const icoMesh = new THREE.Mesh(icoGeo, icoMat);
      icoMesh.position.set(16, -6, -4);
      scene.add(icoMesh);

      // Floating Celestial Torus Ring
      const torusGeo = new THREE.TorusGeometry(6, 0.12, 16, 80);
      const torusMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        wireframe: true,
        transparent: true,
        opacity: 0.18,
      });
      const torusMesh = new THREE.Mesh(torusGeo, torusMat);
      torusMesh.position.set(-16, 7, -6);
      scene.add(torusMesh);

      // Small Octahedron
      const octaGeo = new THREE.OctahedronGeometry(2.5, 0);
      const octaMat = new THREE.MeshBasicMaterial({
        color: 0xa855f7,
        wireframe: true,
        transparent: true,
        opacity: 0.2,
      });
      const octaMesh = new THREE.Mesh(octaGeo, octaMat);
      octaMesh.position.set(12, 11, -8);
      scene.add(octaMesh);

      // 7. Interactive Mouse Tracking & Parallax
      let mouseX = 0;
      let mouseY = 0;
      let targetX = 0;
      let targetY = 0;

      const handleMouseMove = (e: MouseEvent) => {
        // Normalized coordinates [-1, 1]
        mouseX = (e.clientX / window.innerWidth) * 2 - 1;
        mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
      };

      window.addEventListener('mousemove', handleMouseMove, { passive: true });

      // Resize Handler
      const handleResize = () => {
        if (!container || !renderer) return;
        const newW = container.clientWidth || window.innerWidth;
        const newH = container.clientHeight || window.innerHeight;
        camera.aspect = newW / newH;
        camera.updateProjectionMatrix();
        renderer.setSize(newW, newH);
      };

      window.addEventListener('resize', handleResize);

      // 8. 60 FPS Render & Interactive Animation Loop
      let clock = new THREE.Clock();

      const animate = () => {
        animFrameId = requestAnimationFrame(animate);

        // Pause rendering when tab is in background to save CPU and battery
        if (typeof document !== 'undefined' && document.hidden) return;

        const elapsedTime = clock.getElapsedTime();

        // Smooth camera damping towards mouse target
        targetX += (mouseX - targetX) * 0.045;
        targetY += (mouseY - targetY) * 0.045;

        camera.position.x = targetX * 4.5;
        camera.position.y = targetY * 3.5;
        camera.lookAt(0, 0, 0);

        // Move cursor point light to follow mouse in world coords
        cursorLight.position.x = targetX * 18;
        cursorLight.position.y = targetY * 14;

        // Subtle ambient continuous rotation
        particleSystem.rotation.y = elapsedTime * 0.025;
        particleSystem.rotation.x = Math.sin(elapsedTime * 0.02) * 0.08;

        lineSegments.rotation.y = elapsedTime * 0.025;
        lineSegments.rotation.x = Math.sin(elapsedTime * 0.02) * 0.08;

        // Rotate ambient floating 3D wireframe cores
        icoMesh.rotation.x = elapsedTime * 0.12;
        icoMesh.rotation.y = elapsedTime * 0.15;
        icoMesh.position.y = -6 + Math.sin(elapsedTime * 0.6) * 1.2;

        torusMesh.rotation.x = elapsedTime * 0.08;
        torusMesh.rotation.y = elapsedTime * 0.18;
        torusMesh.position.y = 7 + Math.cos(elapsedTime * 0.5) * 1.4;

        octaMesh.rotation.y = elapsedTime * 0.2;
        octaMesh.rotation.z = elapsedTime * 0.15;

        if (renderer) {
          renderer.render(scene, camera);
        }
      };

      animate();

      // Cleanup on unmount
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('resize', handleResize);
        cancelAnimationFrame(animFrameId);

        if (renderer && renderer.domElement && container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
          renderer.dispose();
        }

        particleGeometry.dispose();
        particleMaterial.dispose();
        lineGeometry.dispose();
        lineMaterial.dispose();
        icoGeo.dispose();
        icoMat.dispose();
        torusGeo.dispose();
        torusMat.dispose();
        octaGeo.dispose();
        octaMat.dispose();
      };
    } catch (err) {
      console.warn('3D WebGL background could not initialize on this device:', err);
    }
  }, [intensity]);

  return (
    <div
      ref={mountRef}
      className={`fixed inset-0 pointer-events-none z-0 overflow-hidden select-none transition-opacity duration-1000 ${className}`}
      aria-hidden="true"
    />
  );
};
