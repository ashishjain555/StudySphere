import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Sparkles, MessageSquare, FileText, HelpCircle, X, ChevronUp, Bot } from 'lucide-react';

interface FloatingAIAssistant3DProps {
  onNavigate?: (path: string) => void;
}

export const FloatingAIAssistant3D: React.FC<FloatingAIAssistant3DProps> = ({ onNavigate }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let animId: number;
    let renderer: THREE.WebGLRenderer | null = null;

    try {
      const width = container.clientWidth || 96;
      const height = container.clientHeight || 96;

      // 1. Scene, Camera, WebGL Renderer
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
      camera.position.z = 7.5;

      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      container.appendChild(renderer.domElement);

      // 2. Dynamic Lighting
      const coreLight = new THREE.PointLight(0x38bdf8, 3, 20);
      coreLight.position.set(0, 0, 3);
      scene.add(coreLight);

      const purpleLight = new THREE.PointLight(0xa855f7, 2.5, 20);
      purpleLight.position.set(-3, 2, 2);
      scene.add(purpleLight);

      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      scene.add(ambientLight);

      // 3. 3D Holographic Inner Core
      const coreGroup = new THREE.Group();
      scene.add(coreGroup);

      // Glowing Inner Sphere
      const sphereGeo = new THREE.SphereGeometry(1.2, 24, 24);
      const sphereMat = new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        emissive: 0x0369a1,
        emissiveIntensity: 0.7,
        roughness: 0.2,
        metalness: 0.8,
        wireframe: false,
      });
      const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
      coreGroup.add(sphereMesh);

      // Outer Wireframe Icosahedron Geodesic Shield
      const icoGeo = new THREE.IcosahedronGeometry(1.65, 1);
      const icoMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        wireframe: true,
        transparent: true,
        opacity: 0.45,
      });
      const icoMesh = new THREE.Mesh(icoGeo, icoMat);
      coreGroup.add(icoMesh);

      // 4. Interlocking Quantum Gyroscopic Rings
      const ring1Geo = new THREE.TorusGeometry(2.1, 0.045, 12, 48);
      const ring1Mat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        emissiveIntensity: 0.9,
        metalness: 0.9,
        roughness: 0.1,
      });
      const ring1Mesh = new THREE.Mesh(ring1Geo, ring1Mat);
      coreGroup.add(ring1Mesh);

      const ring2Geo = new THREE.TorusGeometry(2.35, 0.045, 12, 48);
      const ring2Mat = new THREE.MeshStandardMaterial({
        color: 0xa855f7,
        emissive: 0x7e22ce,
        emissiveIntensity: 0.9,
        metalness: 0.9,
        roughness: 0.1,
      });
      const ring2Mesh = new THREE.Mesh(ring2Geo, ring2Mat);
      ring2Mesh.rotation.x = Math.PI * 0.45;
      coreGroup.add(ring2Mesh);

      // 5. Orbiting Stardust Particles
      const particleCount = 42;
      const partGeo = new THREE.BufferGeometry();
      const posArray = new Float32Array(particleCount * 3);
      const orbitRadii: number[] = [];
      const orbitSpeeds: number[] = [];
      const orbitPhases: number[] = [];

      for (let i = 0; i < particleCount; i++) {
        const radius = 2.4 + Math.random() * 0.8;
        orbitRadii.push(radius);
        orbitSpeeds.push((0.8 + Math.random() * 1.5) * (Math.random() > 0.5 ? 1 : -1));
        orbitPhases.push(Math.random() * Math.PI * 2);

        posArray[i * 3] = Math.cos(orbitPhases[i]) * radius;
        posArray[i * 3 + 1] = (Math.random() - 0.5) * 1.2;
        posArray[i * 3 + 2] = Math.sin(orbitPhases[i]) * radius;
      }

      partGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

      // Spark texture
      const cv = document.createElement('canvas');
      cv.width = 32;
      cv.height = 32;
      const ctx = cv.getContext('2d');
      if (ctx) {
        const rad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
        rad.addColorStop(0, '#ffffff');
        rad.addColorStop(0.3, '#38bdf8');
        rad.addColorStop(1, 'transparent');
        ctx.fillStyle = rad;
        ctx.fillRect(0, 0, 32, 32);
      }
      const partTex = new THREE.CanvasTexture(cv);

      const partMat = new THREE.PointsMaterial({
        size: 0.28,
        map: partTex,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });

      const particlePoints = new THREE.Points(partGeo, partMat);
      coreGroup.add(particlePoints);

      // 6. Mouse Cursor Proximity Tracking
      let mouseX = 0;
      let mouseY = 0;
      let targetRotX = 0;
      let targetRotY = 0;

      const handleGlobalMouseMove = (e: MouseEvent) => {
        // Track mouse relative to screen center
        mouseX = (e.clientX / window.innerWidth) * 2 - 1;
        mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
      };

      window.addEventListener('mousemove', handleGlobalMouseMove, { passive: true });

      // 7. 60 FPS Render Loop
      const clock = new THREE.Clock();

      const animate = () => {
        animId = requestAnimationFrame(animate);
        const elapsed = clock.getElapsedTime();

        // Smoothly tilt core towards mouse position
        targetRotY += (mouseX * 0.9 - targetRotY) * 0.08;
        targetRotX += (-mouseY * 0.9 - targetRotX) * 0.08;

        coreGroup.rotation.y = targetRotY + elapsed * 0.35;
        coreGroup.rotation.x = targetRotX + Math.sin(elapsed * 0.8) * 0.15;

        // Counter-rotating rings
        ring1Mesh.rotation.z = elapsed * 1.2;
        ring2Mesh.rotation.y = -elapsed * 1.5;

        // Core pulsating breathing
        const pulse = 1 + Math.sin(elapsed * 2.8) * 0.06;
        sphereMesh.scale.set(pulse, pulse, pulse);

        // Update orbiting particles
        const pos = partGeo.attributes.position.array as Float32Array;
        for (let i = 0; i < particleCount; i++) {
          const angle = orbitPhases[i] + elapsed * orbitSpeeds[i] * 0.8;
          pos[i * 3] = Math.cos(angle) * orbitRadii[i];
          pos[i * 3 + 1] = Math.sin(elapsed * 1.5 + i) * 0.6;
          pos[i * 3 + 2] = Math.sin(angle) * orbitRadii[i];
        }
        partGeo.attributes.position.needsUpdate = true;

        if (renderer) {
          renderer.render(scene, camera);
        }
      };

      animate();

      return () => {
        window.removeEventListener('mousemove', handleGlobalMouseMove);
        cancelAnimationFrame(animId);

        if (renderer && renderer.domElement && container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
          renderer.dispose();
        }

        sphereGeo.dispose();
        sphereMat.dispose();
        icoGeo.dispose();
        icoMat.dispose();
        ring1Geo.dispose();
        ring1Mat.dispose();
        ring2Geo.dispose();
        ring2Mat.dispose();
        partGeo.dispose();
        partMat.dispose();
        partTex.dispose();
      };
    } catch (err) {
      console.warn('3D AI Companion WebGL fallback:', err);
    }
  }, []);

  const handleActionClick = (path: string) => {
    setIsOpen(false);
    if (onNavigate) {
      onNavigate(path);
    } else {
      window.location.href = path;
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 select-none">
      {/* 1. Quick Assistant Popup Flyout Card */}
      {isOpen && (
        <div className="mb-3 w-80 rounded-3xl glass-panel bg-slate-950/95 border border-blue-500/40 shadow-2xl p-5 space-y-4 animate-modalPop text-slate-100 backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shadow-inner">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  StudySphere Neural AI
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </h4>
                <p className="text-[10px] text-slate-400">Contextual Learning Assistant</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1.5">
            <p className="text-xs text-slate-300 leading-relaxed font-normal">
              Need assistance mastering your syllabus? Pick an AI tool to jump directly into action:
            </p>
          </div>

          <div className="space-y-2 pt-1">
            <button
              onClick={() => handleActionClick('/app/ai-tutor')}
              className="w-full p-2.5 rounded-xl bg-blue-600/10 hover:bg-blue-600/25 border border-blue-500/20 hover:border-blue-500/40 text-left transition-all flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                <MessageSquare className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-white group-hover:text-blue-300 transition-colors">
                  Ask Study Tutor
                </div>
                <div className="text-[10px] text-slate-400">Deep conceptual explanations</div>
              </div>
            </button>

            <button
              onClick={() => handleActionClick('/app/pdf-analyzer')}
              className="w-full p-2.5 rounded-xl bg-cyan-600/10 hover:bg-cyan-600/25 border border-cyan-500/20 hover:border-cyan-500/40 text-left transition-all flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                <FileText className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-white group-hover:text-cyan-300 transition-colors">
                  Curriculum PDF Reader
                </div>
                <div className="text-[10px] text-slate-400">Smart summaries & document Q&A</div>
              </div>
            </button>

            <button
              onClick={() => handleActionClick('/app/quiz')}
              className="w-full p-2.5 rounded-xl bg-amber-600/10 hover:bg-amber-600/25 border border-amber-500/20 hover:border-amber-500/40 text-left transition-all flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <HelpCircle className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-white group-hover:text-amber-300 transition-colors">
                  Start Practice Quiz
                </div>
                <div className="text-[10px] text-slate-400">Timed drills & weak-spot diagnostics</div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* 2. Floating 3D Interactive Orb Button */}
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative flex items-center gap-2 cursor-pointer group"
        title="StudySphere 3D Neural Assistant"
      >
        {/* Subtle Floating Label on Hover */}
        {isHovered && !isOpen && (
          <div className="absolute right-24 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-xs text-white shadow-xl backdrop-blur-md whitespace-nowrap animate-fadeIn pointer-events-none">
            <span className="font-semibold text-blue-400">Neural Core</span> • Click for Study Help
          </div>
        )}

        {/* 3D WebGL Canvas Container with Ambient Glow Ring */}
        <div className="relative w-20 h-20 rounded-full flex items-center justify-center bg-slate-950/70 border border-blue-500/30 hover:border-blue-400/60 shadow-[0_0_24px_rgba(56,189,248,0.3)] backdrop-blur-md transition-all group-hover:scale-105">
          <div ref={mountRef} className="w-20 h-20 pointer-events-none" />

          {/* Center glowing badge indicator */}
          <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-slate-950 border border-slate-700/80 shadow-md">
            <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-spin" />
          </div>
        </div>
      </div>
    </div>
  );
};
