import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface MiniAICore3DProps {
  size?: number;
  className?: string;
  isHovered?: boolean;
}

export const MiniAICore3D: React.FC<MiniAICore3DProps> = ({
  size = 110,
  className = '',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [webglOk, setWebglOk] = useState(true);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer;
    let animId: number;

    try {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
      camera.position.z = 7;

      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
      renderer.setSize(size, size);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.innerHTML = '';
      container.appendChild(renderer.domElement);

      // Core Glowing Mesh (Inner)
      const innerGeo = new THREE.SphereGeometry(0.9, 24, 24);
      const innerMat = new THREE.MeshBasicMaterial({
        color: 0x2563eb,
        wireframe: false,
      });
      const innerMesh = new THREE.Mesh(innerGeo, innerMat);
      scene.add(innerMesh);

      // Outer Wireframe Cage (Dodecahedron)
      const outerGeo = new THREE.DodecahedronGeometry(1.6, 0);
      const outerMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        wireframe: true,
        transparent: true,
        opacity: 0.7,
      });
      const outerMesh = new THREE.Mesh(outerGeo, outerMat);
      scene.add(outerMesh);

      // Orbital Ring 1
      const ring1Geo = new THREE.TorusGeometry(2.1, 0.04, 16, 64);
      const ring1Mat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.8,
      });
      const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
      ring1.rotation.x = Math.PI / 3;
      scene.add(ring1);

      // Orbital Ring 2
      const ring2Geo = new THREE.TorusGeometry(2.3, 0.03, 16, 64);
      const ring2Mat = new THREE.MeshBasicMaterial({
        color: 0x64748b,
        transparent: true,
        opacity: 0.6,
      });
      const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
      ring2.rotation.y = Math.PI / 4;
      scene.add(ring2);

      // Ambient Particle Halo
      const haloCount = 30;
      const haloGeo = new THREE.BufferGeometry();
      const haloPos = new Float32Array(haloCount * 3);
      for (let i = 0; i < haloCount; i++) {
        const radius = 2.4 + Math.random() * 0.8;
        const theta = Math.random() * Math.PI * 2;
        const phi = (Math.random() - 0.5) * Math.PI;
        haloPos[i * 3] = radius * Math.cos(theta) * Math.cos(phi);
        haloPos[i * 3 + 1] = radius * Math.sin(phi);
        haloPos[i * 3 + 2] = radius * Math.sin(theta) * Math.cos(phi);
      }
      haloGeo.setAttribute('position', new THREE.BufferAttribute(haloPos, 3));
      const haloMat = new THREE.PointsMaterial({
        size: 0.08,
        color: 0x94a3b8,
        transparent: true,
        opacity: 0.75,
      });
      const halo = new THREE.Points(haloGeo, haloMat);
      scene.add(halo);

      let mouseX = 0;
      let mouseY = 0;

      const onMouseMove = (e: MouseEvent) => {
        const rect = container.getBoundingClientRect();
        mouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
        mouseY = -((e.clientY - rect.top) / rect.height - 0.5) * 2;
      };

      container.addEventListener('mousemove', onMouseMove);

      let clock = new THREE.Clock();

      const render = () => {
        animId = requestAnimationFrame(render);
        const t = clock.getElapsedTime();

        // Rotation kinetics
        outerMesh.rotation.x = t * 0.4;
        outerMesh.rotation.y = t * 0.5;

        innerMesh.scale.setScalar(0.95 + Math.sin(t * 3) * 0.08);

        ring1.rotation.z = t * 0.7;
        ring1.rotation.x = Math.PI / 3 + Math.sin(t * 0.8) * 0.2;

        ring2.rotation.z = -t * 0.6;
        ring2.rotation.y = Math.PI / 4 + Math.cos(t * 0.9) * 0.2;

        halo.rotation.y = -t * 0.2;

        // Mouse Parallax tilt
        camera.position.x += (mouseX * 1.5 - camera.position.x) * 0.08;
        camera.position.y += (mouseY * 1.2 - camera.position.y) * 0.08;
        camera.lookAt(0, 0, 0);

        renderer.render(scene, camera);
      };

      render();

      return () => {
        cancelAnimationFrame(animId);
        container.removeEventListener('mousemove', onMouseMove);
        renderer.dispose();
        innerGeo.dispose();
        innerMat.dispose();
        outerGeo.dispose();
        outerMat.dispose();
        ring1Geo.dispose();
        ring1Mat.dispose();
        ring2Geo.dispose();
        ring2Mat.dispose();
        haloGeo.dispose();
        haloMat.dispose();
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
        className={`flex items-center justify-center rounded-2xl bg-indigo-950/40 border border-indigo-500/30 ${className}`}
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-sky-400 animate-pulse" />
      </div>
    );
  }

  return (
    <div
      ref={mountRef}
      style={{ width: size, height: size }}
      className={`relative cursor-pointer transition-transform duration-300 hover:scale-110 ${className}`}
      title="StudySphere Neural AI Core"
    />
  );
};
