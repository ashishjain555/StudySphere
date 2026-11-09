import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Brain, Cpu, Layers, RotateCcw, Sparkles, Orbit } from 'lucide-react';

interface FloatingNode {
  title: string;
  category: string;
  color: string;
  position: THREE.Vector3;
  mesh?: THREE.Mesh;
}

export const LearningNetwork3D: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [webGlSupported, setWebGlSupported] = useState(true);
  const [isInteracting, setIsInteracting] = useState(false);
  const [activeNode, setActiveNode] = useState<string | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer;
    let animFrameId: number;

    try {
      const width = container.clientWidth || 600;
      const height = container.clientHeight || 500;

      // 1. Scene, Camera, Renderer
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
      camera.position.z = 22;

      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.appendChild(renderer.domElement);

      // 2. Lighting Setup
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
      scene.add(ambientLight);

      const centerLight = new THREE.PointLight(0x60a5fa, 3, 35);
      centerLight.position.set(0, 0, 5);
      scene.add(centerLight);

      const cursorLight = new THREE.PointLight(0xa855f7, 2.5, 30);
      cursorLight.position.set(0, 0, 12);
      scene.add(cursorLight);

      // Main Interactive World Container (Rotated by User Drag & Idle Animation)
      const worldGroup = new THREE.Group();
      scene.add(worldGroup);

      // 3. Central StudySphere Core
      // 3A. Inner Pulsing Core
      const coreSphereGeo = new THREE.SphereGeometry(2.0, 32, 32);
      const coreSphereMat = new THREE.MeshPhongMaterial({
        color: 0x1e40af,
        emissive: 0x3b82f6,
        emissiveIntensity: 0.6,
        shininess: 90,
        transparent: true,
        opacity: 0.9,
      });
      const coreSphere = new THREE.Mesh(coreSphereGeo, coreSphereMat);
      worldGroup.add(coreSphere);

      // 3B. Geodesic Wireframe Outer Shell
      const icosaGeo = new THREE.IcosahedronGeometry(3.2, 2);
      const icosaMat = new THREE.MeshBasicMaterial({
        color: 0x60a5fa,
        wireframe: true,
        transparent: true,
        opacity: 0.45,
      });
      const icosaMesh = new THREE.Mesh(icosaGeo, icosaMat);
      worldGroup.add(icosaMesh);

      // 4. Multi-Axis Holographic Orbital Rings
      const ringMaterials = [
        new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.8, side: THREE.DoubleSide }),
        new THREE.MeshBasicMaterial({ color: 0xa855f7, transparent: true, opacity: 0.75, side: THREE.DoubleSide }),
        new THREE.MeshBasicMaterial({ color: 0x34d399, transparent: true, opacity: 0.7, side: THREE.DoubleSide }),
      ];

      const ring1Geo = new THREE.TorusGeometry(4.8, 0.045, 16, 100);
      const ring1 = new THREE.Mesh(ring1Geo, ringMaterials[0]);
      worldGroup.add(ring1);

      const ring2Geo = new THREE.TorusGeometry(5.6, 0.04, 16, 100);
      const ring2 = new THREE.Mesh(ring2Geo, ringMaterials[1]);
      ring2.rotation.x = Math.PI / 2.3;
      ring2.rotation.y = Math.PI / 6;
      worldGroup.add(ring2);

      const ring3Geo = new THREE.TorusGeometry(6.4, 0.035, 16, 100);
      const ring3 = new THREE.Mesh(ring3Geo, ringMaterials[2]);
      ring3.rotation.x = -Math.PI / 3;
      ring3.rotation.z = Math.PI / 4;
      worldGroup.add(ring3);

      // Traveling Energy Beads on Rings
      const beadGeo = new THREE.SphereGeometry(0.18, 12, 12);
      const beadMat1 = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const bead1 = new THREE.Mesh(beadGeo, beadMat1);
      worldGroup.add(bead1);

      const beadMat2 = new THREE.MeshBasicMaterial({ color: 0xc084fc });
      const bead2 = new THREE.Mesh(beadGeo, beadMat2);
      worldGroup.add(bead2);

      const beadMat3 = new THREE.MeshBasicMaterial({ color: 0x6ee7b7 });
      const bead3 = new THREE.Mesh(beadGeo, beadMat3);
      worldGroup.add(bead3);

      // 5. Constellation Knowledge Nodes & Synaptic Lines
      const particleCount = 110;
      const particleGeo = new THREE.BufferGeometry();
      const positions = new Float32Array(particleCount * 3);
      const colors = new Float32Array(particleCount * 3);

      const colorPalette = [
        new THREE.Color('#38bdf8'),
        new THREE.Color('#818cf8'),
        new THREE.Color('#c084fc'),
        new THREE.Color('#34d399'),
        new THREE.Color('#fbbf24'),
      ];

      for (let i = 0; i < particleCount; i++) {
        // Distribute in a spherical cloud around center
        const r = 7.5 + Math.random() * 6.5;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);

        positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = r * Math.cos(phi);

        const col = colorPalette[i % colorPalette.length];
        colors[i * 3] = col.r;
        colors[i * 3 + 1] = col.g;
        colors[i * 3 + 2] = col.b;
      }

      particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

      const particleMat = new THREE.PointsMaterial({
        size: 0.42,
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
      });

      const particlePoints = new THREE.Points(particleGeo, particleMat);
      worldGroup.add(particlePoints);

      // Dynamic Laser Line Network
      const linePositions: number[] = [];
      for (let i = 0; i < particleCount; i++) {
        for (let j = i + 1; j < particleCount; j++) {
          const dx = positions[i * 3] - positions[j * 3];
          const dy = positions[i * 3 + 1] - positions[j * 3 + 1];
          const dz = positions[i * 3 + 2] - positions[j * 3 + 2];
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (dist < 4.2) {
            linePositions.push(
              positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2],
              positions[j * 3], positions[j * 3 + 1], positions[j * 3 + 2]
            );
          }
        }
      }

      const lineGeo = new THREE.BufferGeometry();
      lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
      const lineMat = new THREE.LineBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.18,
      });
      const linesMesh = new THREE.LineSegments(lineGeo, lineMat);
      worldGroup.add(linesMesh);

      // 6. Orbiting Knowledge Polyhedra (Interactive Platonic Solids)
      const platonicGeos = [
        new THREE.DodecahedronGeometry(0.85, 0),
        new THREE.OctahedronGeometry(0.9, 0),
        new THREE.IcosahedronGeometry(0.85, 0),
        new THREE.TetrahedronGeometry(0.95, 0),
        new THREE.BoxGeometry(0.9, 0.9, 0.9),
      ];

      const orbiterData: {
        mesh: THREE.Mesh;
        radius: number;
        speed: number;
        verticalOffset: number;
        phase: number;
      }[] = [];

      const orbiterColors = [0x38bdf8, 0xa855f7, 0x34d399, 0xf59e0b, 0xec4899];

      platonicGeos.forEach((geo, idx) => {
        const mat = new THREE.MeshPhongMaterial({
          color: orbiterColors[idx],
          wireframe: true,
          emissive: orbiterColors[idx],
          emissiveIntensity: 0.35,
          transparent: true,
          opacity: 0.85,
        });

        const mesh = new THREE.Mesh(geo, mat);
        worldGroup.add(mesh);

        orbiterData.push({
          mesh,
          radius: 8.8 + (idx % 2 === 0 ? 1.4 : -1.0),
          speed: 0.45 + idx * 0.08,
          verticalOffset: (idx - 2) * 1.8,
          phase: (idx * Math.PI * 2) / 5,
        });
      });

      // 7. USER INTERACTION: Drag to Rotate 360° + Mouse Parallax
      let isDragging = false;
      let previousPointerX = 0;
      let previousPointerY = 0;
      let velocityX = 0;
      let velocityY = 0;

      let targetWorldRotationX = 0.2;
      let targetWorldRotationY = 0;

      let mouseNormX = 0;
      let mouseNormY = 0;

      const onPointerDown = (e: PointerEvent) => {
        isDragging = true;
        setIsInteracting(true);
        previousPointerX = e.clientX;
        previousPointerY = e.clientY;
        velocityX = 0;
        velocityY = 0;
        container.setPointerCapture?.(e.pointerId);
      };

      const onPointerMove = (e: PointerEvent) => {
        const rect = container.getBoundingClientRect();
        mouseNormX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
        mouseNormY = -((e.clientY - rect.top) / rect.height - 0.5) * 2;

        if (!isDragging) return;

        const deltaX = e.clientX - previousPointerX;
        const deltaY = e.clientY - previousPointerY;

        velocityX = deltaX * 0.007;
        velocityY = deltaY * 0.007;

        targetWorldRotationY += velocityX;
        targetWorldRotationX += velocityY;

        previousPointerX = e.clientX;
        previousPointerY = e.clientY;
      };

      const onPointerUp = (e: PointerEvent) => {
        isDragging = false;
        container.releasePointerCapture?.(e.pointerId);
        setTimeout(() => setIsInteracting(false), 800);
      };

      container.addEventListener('pointerdown', onPointerDown);
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
      window.addEventListener('pointercancel', onPointerUp);

      // 8. Main 60 FPS Animation Loop
      const clock = new THREE.Clock();

      const animate = () => {
        animFrameId = requestAnimationFrame(animate);
        const elapsed = clock.getElapsedTime();

        // If not actively dragging, apply gentle ambient momentum
        if (!isDragging) {
          targetWorldRotationY += 0.0025; // Continuous graceful spin
          velocityX *= 0.94;
          velocityY *= 0.94;
          targetWorldRotationY += velocityX;
          targetWorldRotationX += velocityY;
        }

        // Clamp vertical pitch to prevent flipping
        targetWorldRotationX = Math.max(-1.1, Math.min(1.1, targetWorldRotationX));

        // Smoothly interpolate world group orientation
        worldGroup.rotation.y += (targetWorldRotationY - worldGroup.rotation.y) * 0.08;
        worldGroup.rotation.x += (targetWorldRotationX - worldGroup.rotation.x) * 0.08;

        // Inner Core Breathing & Pulse
        const pulse = 1 + Math.sin(elapsed * 2.8) * 0.07;
        coreSphere.scale.set(pulse, pulse, pulse);
        icosaMesh.rotation.y = -elapsed * 0.35;
        icosaMesh.rotation.z = elapsed * 0.2;

        // Orbital Ring Dynamics
        ring1.rotation.z = elapsed * 0.6;
        ring2.rotation.z = -elapsed * 0.55;
        ring3.rotation.z = elapsed * 0.45;

        // Beads gliding along rings
        const a1 = elapsed * 1.2;
        bead1.position.set(Math.cos(a1) * 4.8, Math.sin(a1) * 4.8, 0);

        const a2 = -elapsed * 1.0;
        const b2x = Math.cos(a2) * 5.6;
        const b2y = Math.sin(a2) * 5.6;
        bead2.position.set(b2x, b2y * Math.cos(ring2.rotation.x), b2y * Math.sin(ring2.rotation.x));

        const a3 = elapsed * 0.9;
        const b3x = Math.cos(a3) * 6.4;
        const b3y = Math.sin(a3) * 6.4;
        bead3.position.set(b3x, b3y * Math.cos(ring3.rotation.x), b3y * Math.sin(ring3.rotation.x));

        // Orbiting Platonic Solids
        orbiterData.forEach((item, idx) => {
          const theta = elapsed * item.speed + item.phase;
          item.mesh.position.x = Math.cos(theta) * item.radius;
          item.mesh.position.z = Math.sin(theta) * item.radius * 0.75;
          item.mesh.position.y = item.verticalOffset + Math.sin(elapsed * 2.0 + idx) * 1.1;

          item.mesh.rotation.x += 0.02;
          item.mesh.rotation.y += 0.025;
        });

        // Dynamic Cursor Spotlight
        cursorLight.position.x = mouseNormX * 14;
        cursorLight.position.y = mouseNormY * 10;

        // Camera Parallax
        camera.position.x += (mouseNormX * 2.5 - camera.position.x) * 0.05;
        camera.position.y += (mouseNormY * 1.8 - camera.position.y) * 0.05;
        camera.lookAt(0, 0, 0);

        renderer.render(scene, camera);
      };

      animate();

      // 9. Resize Handling with ResizeObserver
      const handleResize = () => {
        if (!container || !renderer) return;
        const w = container.clientWidth;
        const h = container.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };

      const resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(container);

      // 10. Memory Cleanup
      return () => {
        container.removeEventListener('pointerdown', onPointerDown);
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
        window.removeEventListener('pointercancel', onPointerUp);
        resizeObserver.disconnect();
        cancelAnimationFrame(animFrameId);

        // Dispose geometries & materials
        coreSphereGeo.dispose();
        coreSphereMat.dispose();
        icosaGeo.dispose();
        icosaMat.dispose();
        ring1Geo.dispose();
        ring2Geo.dispose();
        ring3Geo.dispose();
        ringMaterials.forEach((m) => m.dispose());
        beadGeo.dispose();
        beadMat1.dispose();
        beadMat2.dispose();
        beadMat3.dispose();
        particleGeo.dispose();
        particleMat.dispose();
        lineGeo.dispose();
        lineMat.dispose();
        platonicGeos.forEach((g) => g.dispose());

        renderer.dispose();
        if (container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
      };
    } catch (e) {
      console.warn('WebGL initialization failed:', e);
      setWebGlSupported(false);
    }
  }, []);

  return (
    <div className="relative w-full h-full min-h-[460px] sm:min-h-[500px] flex items-center justify-center overflow-hidden rounded-3xl glass-panel border border-slate-800/80 bg-slate-950/60 shadow-2xl group select-none">
      {/* 3D Canvas Mount with Grab/Grabbing Cursors */}
      <div
        ref={mountRef}
        className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing touch-none z-0"
        title="Click and drag to spin 360°"
      />

      {/* Floating HUD Controls & Badges */}
      {/* Top Left: Interactive Mode Pill */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-800/90 text-slate-300 text-[11px] font-mono shadow-lg transition-transform group-hover:scale-105">
        <Orbit className="w-3.5 h-3.5 text-blue-400 animate-spin" style={{ animationDuration: '8s' }} />
        <span>StudySphere 3D Core</span>
      </div>

      {/* Top Right: 360° Drag Indicator */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-800/90 text-slate-300 text-[11px] font-medium shadow-lg">
        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
        <span className="hidden sm:inline">Drag to Rotate 360°</span>
        <span className="sm:hidden">Drag 360°</span>
      </div>

      {/* Bottom Center: Interactive Knowledge Pills */}
      <div className="absolute bottom-4 inset-x-4 z-10 flex items-center justify-center gap-2 flex-wrap pointer-events-none">
        <div className="px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/25 text-blue-300 text-[10px] font-mono uppercase tracking-wider backdrop-blur-md">
          📐 Math
        </div>
        <div className="px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/25 text-purple-300 text-[10px] font-mono uppercase tracking-wider backdrop-blur-md">
          ⚡ Physics
        </div>
        <div className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-[10px] font-mono uppercase tracking-wider backdrop-blur-md">
          🤖 AI Tutor
        </div>
        <div className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-300 text-[10px] font-mono uppercase tracking-wider backdrop-blur-md">
          📄 PDF Neural
        </div>
      </div>

      {/* Dragging State Halo */}
      {isInteracting && (
        <div className="absolute inset-0 border-2 border-blue-500/20 rounded-3xl pointer-events-none transition-opacity animate-pulse" />
      )}

      {/* Center Ambient Light Glow */}
      <div className="absolute inset-0 bg-radial-gradient from-blue-600/10 via-purple-600/5 to-transparent pointer-events-none" />

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
