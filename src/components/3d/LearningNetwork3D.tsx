import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Brain, Cpu, Layers } from 'lucide-react';

export const LearningNetwork3D: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [webGlSupported, setWebGlSupported] = useState(true);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer;

    try {
      const width = container.clientWidth || 600;
      const height = container.clientHeight || 480;

      // Scene, Camera, Renderer
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 1000);
      camera.position.z = 24;

      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.appendChild(renderer.domElement);

      // Interactive Point Light that tracks mouse
      const cursorLight = new THREE.PointLight(0x38bdf8, 2, 40);
      cursorLight.position.set(0, 0, 15);
      scene.add(cursorLight);

      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      scene.add(ambientLight);

      // Particle Knowledge Nodes
      const particleCount = 100;
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(particleCount * 3);
      const colors = new Float32Array(particleCount * 3);

      const colorPool = [
        new THREE.Color('#3B82F6'),
        new THREE.Color('#60A5FA'),
        new THREE.Color('#38BDF8'),
        new THREE.Color('#94A3B8'),
        new THREE.Color('#34D399'),
      ];

      for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 40;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 26;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 22;

        const col = colorPool[Math.floor(Math.random() * colorPool.length)];
        colors[i * 3] = col.r;
        colors[i * 3 + 1] = col.g;
        colors[i * 3 + 2] = col.b;
      }

      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

      const material = new THREE.PointsMaterial({
        size: 0.55,
        vertexColors: true,
        transparent: true,
        opacity: 0.85,
      });

      const particles = new THREE.Points(geometry, material);
      scene.add(particles);

      // Lines connecting nearby nodes
      const lineMaterial = new THREE.LineBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.16,
      });

      const lineGeometry = new THREE.BufferGeometry();
      const linePositions: number[] = [];

      const posAttr = geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        for (let j = i + 1; j < particleCount; j++) {
          const dx = posAttr[i * 3] - posAttr[j * 3];
          const dy = posAttr[i * 3 + 1] - posAttr[j * 3 + 1];
          const dz = posAttr[i * 3 + 2] - posAttr[j * 3 + 2];
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (dist < 6.8) {
            linePositions.push(
              posAttr[i * 3], posAttr[i * 3 + 1], posAttr[i * 3 + 2],
              posAttr[j * 3], posAttr[j * 3 + 1], posAttr[j * 3 + 2]
            );
          }
        }
      }

      lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
      const linesMesh = new THREE.LineSegments(lineGeometry, lineMaterial);
      scene.add(linesMesh);

      // Central Glowing AI Core Group
      const coreGroup = new THREE.Group();
      scene.add(coreGroup);

      // 1. Core Icosahedron Wireframe
      const coreGeo = new THREE.IcosahedronGeometry(2.6, 2);
      const coreMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        wireframe: true,
        transparent: true,
        opacity: 0.5,
      });
      const coreMesh = new THREE.Mesh(coreGeo, coreMat);
      coreGroup.add(coreMesh);

      // 2. Inner Pulsing Core
      const innerCoreGeo = new THREE.SphereGeometry(1.3, 20, 20);
      const innerCoreMat = new THREE.MeshBasicMaterial({
        color: 0x2563eb,
        wireframe: false,
      });
      const innerCore = new THREE.Mesh(innerCoreGeo, innerCoreMat);
      coreGroup.add(innerCore);

      // 3. Dual Gyroscope Holographic Rings
      const gyroRing1Geo = new THREE.TorusGeometry(3.6, 0.05, 16, 80);
      const gyroRing1Mat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.85,
      });
      const gyroRing1 = new THREE.Mesh(gyroRing1Geo, gyroRing1Mat);
      coreGroup.add(gyroRing1);

      const gyroRing2Geo = new THREE.TorusGeometry(4.1, 0.04, 16, 80);
      const gyroRing2Mat = new THREE.MeshBasicMaterial({
        color: 0x64748b,
        transparent: true,
        opacity: 0.75,
      });
      const gyroRing2 = new THREE.Mesh(gyroRing2Geo, gyroRing2Mat);
      gyroRing2.rotation.x = Math.PI / 2.2;
      coreGroup.add(gyroRing2);

      // Orbiting 3D Knowledge Polyhedra (Platonic Solids)
      const orbiters: { mesh: THREE.Mesh; speed: number; radius: number; yOffset: number; axis: THREE.Vector3 }[] = [];
      const geometries = [
        new THREE.OctahedronGeometry(1.1, 0),
        new THREE.DodecahedronGeometry(1.0, 0),
        new THREE.TetrahedronGeometry(1.2, 0),
        new THREE.IcosahedronGeometry(1.1, 0),
      ];

      for (let i = 0; i < 4; i++) {
        const mat = new THREE.MeshBasicMaterial({
          color: i % 2 === 0 ? 0x60a5fa : 0x38bdf8,
          wireframe: true,
          transparent: true,
          opacity: 0.8,
        });
        const mesh = new THREE.Mesh(geometries[i], mat);
        scene.add(mesh);

        orbiters.push({
          mesh,
          speed: 0.35 + i * 0.1,
          radius: 8.5 + (i % 2 === 0 ? 1.5 : -1.0),
          yOffset: (i - 1.5) * 2.2,
          axis: new THREE.Vector3(Math.sin(i), Math.cos(i), 0.5).normalize(),
        });
      }

      // Mouse Interaction
      let mouseX = 0;
      let mouseY = 0;

      const handleMouseMove = (event: MouseEvent) => {
        const rect = container.getBoundingClientRect();
        mouseX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
        mouseY = -((event.clientY - rect.top) / rect.height - 0.5) * 2;
      };

      window.addEventListener('mousemove', handleMouseMove);

      // Animation Loop
      let animationFrameId: number;
      let clock = new THREE.Clock();

      const animate = () => {
        animationFrameId = requestAnimationFrame(animate);
        const elapsedTime = clock.getElapsedTime();

        // Particles and line mesh rotation
        particles.rotation.y = elapsedTime * 0.04;
        particles.rotation.x = elapsedTime * 0.015;
        linesMesh.rotation.y = elapsedTime * 0.04;
        linesMesh.rotation.x = elapsedTime * 0.015;

        // Core Group rotation & kinetics
        coreMesh.rotation.y = -elapsedTime * 0.25;
        coreMesh.rotation.z = elapsedTime * 0.18;
        innerCore.scale.setScalar(1 + Math.sin(elapsedTime * 3.2) * 0.08);

        // Gyro rings counter-rotation
        gyroRing1.rotation.z = elapsedTime * 0.5;
        gyroRing1.rotation.y = Math.sin(elapsedTime * 0.4) * 0.3;

        gyroRing2.rotation.z = -elapsedTime * 0.45;
        gyroRing2.rotation.x = (Math.PI / 2.2) + Math.cos(elapsedTime * 0.35) * 0.3;

        // Update cursor light
        cursorLight.position.x = mouseX * 12;
        cursorLight.position.y = mouseY * 8;

        // Orbiting platonic solids
        orbiters.forEach((orb, idx) => {
          const angle = elapsedTime * orb.speed + (idx * Math.PI) / 2;
          orb.mesh.position.x = Math.cos(angle) * orb.radius;
          orb.mesh.position.z = Math.sin(angle) * orb.radius * 0.6;
          orb.mesh.position.y = orb.yOffset + Math.sin(elapsedTime * 1.5 + idx) * 1.2;

          orb.mesh.rotation.x += 0.015;
          orb.mesh.rotation.y += 0.02;
        });

        // Smooth camera dampening with mouse parallax
        camera.position.x += (mouseX * 4 - camera.position.x) * 0.05;
        camera.position.y += (mouseY * 2.5 - camera.position.y) * 0.05;
        camera.lookAt(scene.position);

        renderer.render(scene, camera);
      };

      animate();

      const handleResize = () => {
        if (!container || !renderer) return;
        const w = container.clientWidth;
        const h = container.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('resize', handleResize);
        cancelAnimationFrame(animationFrameId);
        renderer.dispose();
        geometry.dispose();
        material.dispose();
        lineGeometry.dispose();
        lineMaterial.dispose();
        coreGeo.dispose();
        coreMat.dispose();
        innerCoreGeo.dispose();
        innerCoreMat.dispose();
        gyroRing1Geo.dispose();
        gyroRing1Mat.dispose();
        gyroRing2Geo.dispose();
        gyroRing2Mat.dispose();
        geometries.forEach((g) => g.dispose());
        if (container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
      };
    } catch {
      setWebGlSupported(false);
    }
  }, []);

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-3xl glass-panel border border-slate-800 group">
      {/* 3D Canvas Mount */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Floating Interactive 3D Status Overlay Pill */}
      <div className="absolute bottom-5 left-5 z-10 pointer-events-none flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-800 text-slate-300 text-xs font-mono">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        <span>Knowledge Graph Architecture • 3D</span>
      </div>

      {/* Floating 3D Badge on Top Right */}
      <div className="absolute top-5 right-5 z-10 pointer-events-none flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-slate-300 text-[11px] font-medium backdrop-blur-md">
        <Layers className="w-3.5 h-3.5 text-blue-400" />
        <span>Interactive Canvas</span>
      </div>

      {/* Subtle Gradient Glow in Center */}
      <div className="absolute inset-0 bg-radial-gradient from-indigo-500/10 via-transparent to-transparent pointer-events-none" />

      {/* Fallback for devices without WebGL */}
      {!webGlSupported && (
        <div className="relative z-10 p-8 text-center space-y-4 max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center mx-auto border border-indigo-500/30">
            <Brain className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white">Intelligent Study Matrix</h3>
          <p className="text-sm text-gray-400">
            Interactive knowledge graphs, adaptive quizzes, and curriculum tutoring unified into one workspace.
          </p>
          <div className="flex items-center justify-center gap-2 text-xs text-indigo-400">
            <Cpu className="w-4 h-4" />
            <span>Hardware Acceleration</span>
          </div>
        </div>
      )}
    </div>
  );
};
