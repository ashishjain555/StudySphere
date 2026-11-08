import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ArrowRight, Sparkles } from 'lucide-react';

interface BookOpeningTransitionProps {
  onComplete: () => void;
  title?: string;
  subtitle?: string;
}

export const BookOpeningTransition: React.FC<BookOpeningTransitionProps> = ({
  onComplete,
  title = 'Opening Study Workspace...',
  subtitle = 'Deciphering syllabus & knowledge graph',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [fadeWhite, setFadeWhite] = useState(false);
  const completedRef = useRef(false);

  const handleFinish = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    onComplete();
  };

  useEffect(() => {
    // Keyboard shortcut to skip (Escape or Space)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ') {
        handleFinish();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let animFrameId: number;
    let renderer: THREE.WebGLRenderer | null = null;

    try {
      const width = window.innerWidth;
      const height = window.innerHeight;

      // 1. Scene, Camera, High-performance WebGL Renderer
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
      camera.position.set(0, 3.5, 22);
      camera.lookAt(0, 0, 0);

      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.2;
      container.appendChild(renderer.domElement);

      // 2. Dynamic Lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
      scene.add(ambientLight);

      const topKeyLight = new THREE.DirectionalLight(0xfff3d6, 2.2);
      topKeyLight.position.set(5, 15, 12);
      scene.add(topKeyLight);

      const cyanRimLight = new THREE.PointLight(0x38bdf8, 3.5, 35);
      cyanRimLight.position.set(-10, -5, -4);
      scene.add(cyanRimLight);

      // Internal magical burst point light (inside the book)
      const internalLight = new THREE.PointLight(0xffd700, 0.1, 25);
      internalLight.position.set(0, 0.5, 0);
      scene.add(internalLight);

      // Cyan core book light
      const internalCyanLight = new THREE.PointLight(0x38bdf8, 0.1, 20);
      internalCyanLight.position.set(0, 0.8, 0);
      scene.add(internalCyanLight);

      // 3. Helper: Generate High-Res Leather & Gold Embossed Cover Texture
      const createCoverTexture = () => {
        const cv = document.createElement('canvas');
        cv.width = 1024;
        cv.height = 1400;
        const ctx = cv.getContext('2d');
        if (!ctx) return new THREE.Texture();

        // Deep obsidian-midnight gradient background
        const bgGrad = ctx.createLinearGradient(0, 0, 1024, 1400);
        bgGrad.addColorStop(0, '#090d16');
        bgGrad.addColorStop(0.5, '#0f172a');
        bgGrad.addColorStop(1, '#05070e');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, 1024, 1400);

        // Leather grain texture simulation
        ctx.fillStyle = 'rgba(255, 255, 255, 0.025)';
        for (let i = 0; i < 4000; i++) {
          const rx = Math.random() * 1024;
          const ry = Math.random() * 1400;
          ctx.fillRect(rx, ry, 2, 2);
        }

        // Golden ornate borders
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 14;
        ctx.strokeRect(50, 50, 924, 1300);

        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 4;
        ctx.strokeRect(70, 70, 884, 1260);

        // Corner cornerpieces
        const drawCorner = (cx: number, cy: number, rot: number) => {
          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(rot);
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(80, 0);
          ctx.moveTo(0, 0);
          ctx.lineTo(0, 80);
          ctx.stroke();
          ctx.restore();
        };

        drawCorner(85, 85, 0);
        drawCorner(939, 85, Math.PI / 2);
        drawCorner(939, 1315, Math.PI);
        drawCorner(85, 1315, -Math.PI / 2);

        // Central Magical Emblem (StudySphere Logo & Crest)
        const centerX = 512;
        const centerY = 550;

        // Glowing concentric golden rings
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.4)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 210, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 175, 0, Math.PI * 2);
        ctx.stroke();

        // Stylized Graduation & Infinity Glyph
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(centerX, centerY - 25, 45, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(centerX, centerY - 25, 30, 0, Math.PI * 2);
        ctx.fill();

        // Title text in gold
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 64px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('STUDYSPHERE', centerX, 880);

        ctx.fillStyle = '#38bdf8';
        ctx.font = '500 28px monospace';
        ctx.fillText('• KNOWLEDGE GRAPH TOME •', centerX, 935);

        ctx.fillStyle = 'rgba(251, 191, 36, 0.8)';
        ctx.font = 'italic 24px serif';
        ctx.fillText('« Scientia Est Potentia »', centerX, 1120);

        return new THREE.CanvasTexture(cv);
      };

      // 4. Helper: Generate Page Content Texture (Text lines & diagrams)
      const createPageTexture = (pageSide: 'left' | 'right') => {
        const cv = document.createElement('canvas');
        cv.width = 800;
        cv.height = 1100;
        const ctx = cv.getContext('2d');
        if (!ctx) return new THREE.Texture();

        // Parchment / high-tech paper background
        const grad = ctx.createLinearGradient(0, 0, 800, 1100);
        grad.addColorStop(0, '#fefce8');
        grad.addColorStop(1, '#fef3c7');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 800, 1100);

        // Header
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 36px serif';
        ctx.fillText(pageSide === 'left' ? '§ CHAPTER 1: FOUNDATIONS' : 'AI STUDY SYNAPSE', 60, 90);

        // Subtle glowing diagram
        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(400, 320, 80, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#38bdf8';
        ctx.font = '14px monospace';
        ctx.fillText('[NEURAL SYNAPSE CORE]', 320, 325);

        // Lines of script
        ctx.fillStyle = '#334155';
        ctx.font = '16px serif';
        const lines = [
          'Adaptive algorithms synthesize curriculum parameters into structured nodes.',
          'Formulating personalized review pathways for accelerated mastery.',
          'Knowledge retention curves optimized via continuous diagnostic testing.',
          'Active retrieval frameworks deployed across all registered courses.',
          'Synchronizing study calendar and syllabus objectives in real time...',
          'Confidence metrics verified: Retentive memory indexed at 98.4%.',
          'Modular course units unlocked: Physics, Calculus, AI Architecture.',
          'Deep comprehension achieved through contextualized explanation models.',
        ];

        let startY = 460;
        for (const line of lines) {
          ctx.fillText(line, 60, startY);
          startY += 48;
        }

        // Golden stamp at bottom
        ctx.strokeStyle = '#eab308';
        ctx.lineWidth = 3;
        ctx.strokeRect(60, 950, 220, 60);
        ctx.fillStyle = '#b45309';
        ctx.font = 'bold 18px monospace';
        ctx.fillText('VERIFIED SCHOLAR', 85, 988);

        return new THREE.CanvasTexture(cv);
      };

      const coverTexture = createCoverTexture();
      const leftPageTexture = createPageTexture('left');
      const rightPageTexture = createPageTexture('right');

      // 5. Constructing the 3D Book Assembly
      const bookGroup = new THREE.Group();
      scene.add(bookGroup);

      const bookWidth = 6.4;
      const bookHeight = 8.8;
      const bookThickness = 0.85;
      const coverThickness = 0.16;

      // Base Materials
      const spineMaterial = new THREE.MeshStandardMaterial({
        color: 0x090d16,
        roughness: 0.5,
        metalness: 0.3,
      });

      const coverFrontMat = new THREE.MeshStandardMaterial({
        map: coverTexture,
        roughness: 0.35,
        metalness: 0.25,
      });

      const insideCoverMat = new THREE.MeshStandardMaterial({
        map: leftPageTexture,
        roughness: 0.45,
      });

      const goldRimMat = new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        metalness: 0.85,
        roughness: 0.2,
      });

      // BACK COVER
      const backCoverGeo = new THREE.BoxGeometry(bookWidth, bookHeight, coverThickness);
      const backCover = new THREE.Mesh(backCoverGeo, [
        spineMaterial, spineMaterial, spineMaterial, spineMaterial,
        insideCoverMat, coverFrontMat,
      ]);
      backCover.position.set(bookWidth / 2 - 0.2, 0, -bookThickness / 2);
      bookGroup.add(backCover);

      // PAGES BLOCK (Solid block representing closed pages)
      const pagesBlockGeo = new THREE.BoxGeometry(bookWidth - 0.25, bookHeight - 0.3, bookThickness);
      const pagesGiltMat = new THREE.MeshStandardMaterial({
        color: 0xfde047, // Golden gilded page edges
        metalness: 0.7,
        roughness: 0.3,
      });
      const topPageMat = new THREE.MeshStandardMaterial({
        map: rightPageTexture,
        roughness: 0.5,
      });
      const pagesBlock = new THREE.Mesh(pagesBlockGeo, [
        pagesGiltMat, spineMaterial, pagesGiltMat, pagesGiltMat,
        topPageMat, insideCoverMat,
      ]);
      pagesBlock.position.set((bookWidth - 0.25) / 2, 0, 0);
      bookGroup.add(pagesBlock);

      // SPINE (Curved cylinder on left)
      const spineGeo = new THREE.CylinderGeometry(
        bookThickness / 2 + 0.05,
        bookThickness / 2 + 0.05,
        bookHeight,
        16,
        1,
        false,
        Math.PI * 0.5,
        Math.PI
      );
      const spine = new THREE.Mesh(spineGeo, spineMaterial);
      spine.position.set(0, 0, 0);
      spine.rotation.y = Math.PI * 0.5;
      bookGroup.add(spine);

      // FRONT COVER WITH PIVOT AT SPINE (x = 0)
      const frontCoverPivot = new THREE.Group();
      frontCoverPivot.position.set(0, 0, bookThickness / 2);
      bookGroup.add(frontCoverPivot);

      const frontCoverGeo = new THREE.BoxGeometry(bookWidth, bookHeight, coverThickness);
      const frontCoverMesh = new THREE.Mesh(frontCoverGeo, [
        goldRimMat, spineMaterial, goldRimMat, goldRimMat,
        coverFrontMat, insideCoverMat,
      ]);
      // Center the mesh relative to pivot
      frontCoverMesh.position.set(bookWidth / 2, 0, 0);
      frontCoverPivot.add(frontCoverMesh);

      // 6. ANIMATED 3D PAGES (Pages that flip individually from right to left)
      const pageCount = 6;
      const flippingPages: { pivot: THREE.Group; mesh: THREE.Mesh; targetAngle: number; speed: number; startDelay: number }[] = [];

      for (let i = 0; i < pageCount; i++) {
        const pagePivot = new THREE.Group();
        pagePivot.position.set(0, 0, (bookThickness / 2) - 0.08 - (i * 0.04));
        bookGroup.add(pagePivot);

        const pageGeo = new THREE.PlaneGeometry(bookWidth - 0.35, bookHeight - 0.35);
        const pageMat = new THREE.MeshStandardMaterial({
          map: rightPageTexture,
          side: THREE.DoubleSide,
          roughness: 0.5,
        });
        const pageMesh = new THREE.Mesh(pageGeo, pageMat);
        pageMesh.position.set((bookWidth - 0.35) / 2, 0, 0);
        pagePivot.add(pageMesh);

        flippingPages.push({
          pivot: pagePivot,
          mesh: pageMesh,
          targetAngle: -Math.PI * 0.88 - (i * 0.02),
          speed: 2.2 + i * 0.4,
          startDelay: 0.65 + i * 0.14,
        });
      }

      // 7. MAGICAL VERTICAL LIGHT BEAMS (Crepuscular light rays shooting from open pages)
      const beamGeo = new THREE.CylinderGeometry(0.5, 5.5, 18, 32, 1, true);
      const beamMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const lightBeam = new THREE.Mesh(beamGeo, beamMat);
      lightBeam.position.set(2.5, 7, 0);
      scene.add(lightBeam);

      // Secondary Golden Beam
      const goldBeamGeo = new THREE.CylinderGeometry(0.3, 3.8, 14, 24, 1, true);
      const goldBeamMat = new THREE.MeshBasicMaterial({
        color: 0xfbbf24,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const goldLightBeam = new THREE.Mesh(goldBeamGeo, goldBeamMat);
      goldLightBeam.position.set(2.5, 6, 0);
      scene.add(goldLightBeam);

      // 8. CELESTIAL STARDUST / MAGIC PARTICLES
      const particleCount = 240;
      const partGeo = new THREE.BufferGeometry();
      const pPositions = new Float32Array(particleCount * 3);
      const pVelocities = new Float32Array(particleCount * 3);
      const pColors = new Float32Array(particleCount * 3);

      const colorPalette = [
        new THREE.Color('#38bdf8'),
        new THREE.Color('#fbbf24'),
        new THREE.Color('#a855f7'),
        new THREE.Color('#ffffff'),
        new THREE.Color('#34d399'),
      ];

      for (let i = 0; i < particleCount; i++) {
        pPositions[i * 3] = (Math.random() - 0.5) * 5;
        pPositions[i * 3 + 1] = Math.random() * 2;
        pPositions[i * 3 + 2] = (Math.random() - 0.5) * 4;

        pVelocities[i * 3] = (Math.random() - 0.5) * 0.04;
        pVelocities[i * 3 + 1] = 0.03 + Math.random() * 0.08;
        pVelocities[i * 3 + 2] = 0.02 + Math.random() * 0.06;

        const col = colorPalette[i % colorPalette.length];
        pColors[i * 3] = col.r;
        pColors[i * 3 + 1] = col.g;
        pColors[i * 3 + 2] = col.b;
      }

      partGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
      partGeo.setAttribute('color', new THREE.BufferAttribute(pColors, 3));

      // Circular spark texture
      const pCanvas = document.createElement('canvas');
      pCanvas.width = 32;
      pCanvas.height = 32;
      const pctx = pCanvas.getContext('2d');
      if (pctx) {
        const radGrad = pctx.createRadialGradient(16, 16, 0, 16, 16, 16);
        radGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
        radGrad.addColorStop(0.4, 'rgba(251, 191, 36, 0.8)');
        radGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        pctx.fillStyle = radGrad;
        pctx.fillRect(0, 0, 32, 32);
      }
      const particleTexture = new THREE.CanvasTexture(pCanvas);

      const partMat = new THREE.PointsMaterial({
        size: 0.65,
        map: particleTexture,
        vertexColors: true,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });

      const particleSystem = new THREE.Points(partGeo, partMat);
      scene.add(particleSystem);

      // 9. ANIMATION TIMELINE LOOP
      // Initial pose: closed book, tilted in 3D perspective
      bookGroup.rotation.x = 0.38;
      bookGroup.rotation.y = -0.32;
      bookGroup.rotation.z = -0.06;
      bookGroup.position.set(-1.2, -0.6, 2);

      const clock = new THREE.Clock();
      let hasCompleted = false;

      const animate = () => {
        animFrameId = requestAnimationFrame(animate);
        const elapsedTime = clock.getElapsedTime();

        // PHASE 1: Gentle float & orientation (0.0s - 0.5s)
        if (elapsedTime < 0.5) {
          bookGroup.position.y = -0.6 + Math.sin(elapsedTime * 3) * 0.2;
        }

        // PHASE 2: Cover opens smoothly (0.45s - 1.4s)
        if (elapsedTime >= 0.45) {
          const coverProgress = Math.min((elapsedTime - 0.45) / 0.85, 1);
          // Ease-out cubic for realistic heavy book cover inertia
          const easeProgress = 1 - Math.pow(1 - coverProgress, 3);
          const targetCoverAngle = -Math.PI * 0.94; // ~170 degrees open
          frontCoverPivot.rotation.y = easeProgress * targetCoverAngle;

          // Internal light intensity surges as cover unseals
          internalLight.intensity = easeProgress * 12;
          internalCyanLight.intensity = easeProgress * 8;
          beamMat.opacity = easeProgress * 0.45;
          goldBeamMat.opacity = easeProgress * 0.35;
          partMat.opacity = Math.min(easeProgress * 1.2, 1);
        }

        // PHASE 3: Pages flip across one after another (0.65s - 1.8s)
        flippingPages.forEach((p) => {
          if (elapsedTime >= p.startDelay) {
            const pageProgress = Math.min((elapsedTime - p.startDelay) / 0.55, 1);
            const easePage = 1 - Math.pow(1 - pageProgress, 2.5);
            p.pivot.rotation.y = easePage * p.targetAngle;
          }
        });

        // Rotate light beams for ethereal effect
        lightBeam.rotation.y = elapsedTime * 0.4;
        goldLightBeam.rotation.y = -elapsedTime * 0.6;

        // Animate particles rising out of the book towards user
        if (elapsedTime >= 0.6) {
          const positions = partGeo.attributes.position.array as Float32Array;
          for (let i = 0; i < particleCount; i++) {
            positions[i * 3] += pVelocities[i * 3];
            positions[i * 3 + 1] += pVelocities[i * 3 + 1];
            positions[i * 3 + 2] += pVelocities[i * 3 + 2];

            // Reset particle when it flies past camera
            if (positions[i * 3 + 2] > 20) {
              positions[i * 3] = 1.5 + (Math.random() - 0.5) * 4;
              positions[i * 3 + 1] = 0.5 + Math.random() * 2;
              positions[i * 3 + 2] = (Math.random() - 0.5) * 2;
            }
          }
          partGeo.attributes.position.needsUpdate = true;
        }

        // PHASE 4: Camera dives into the book portal (1.75s - 2.3s)
        if (elapsedTime >= 1.75) {
          const diveProgress = Math.min((elapsedTime - 1.75) / 0.55, 1);
          // Ease-in quad zoom
          const easeDive = diveProgress * diveProgress;

          camera.position.z = 22 - easeDive * 18;
          camera.position.y = 3.5 - easeDive * 2.8;
          camera.position.x = easeDive * 1.5;

          // Trigger white/indigo flare bloom in React UI
          if (diveProgress > 0.45 && !fadeWhite) {
            setFadeWhite(true);
          }
        }

        // PHASE 5: Transition Complete (2.35s)
        if (elapsedTime >= 2.35 && !hasCompleted) {
          hasCompleted = true;
          handleFinish();
          return;
        }

        if (renderer) {
          renderer.render(scene, camera);
        }
      };

      animate();

      // Window Resize Handler
      const handleResize = () => {
        if (!container || !renderer) return;
        const newW = window.innerWidth;
        const newH = window.innerHeight;
        camera.aspect = newW / newH;
        camera.updateProjectionMatrix();
        renderer.setSize(newW, newH);
      };
      window.addEventListener('resize', handleResize);

      // Cleanup on unmount
      return () => {
        window.removeEventListener('resize', handleResize);
        cancelAnimationFrame(animFrameId);

        if (renderer && renderer.domElement && container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
          renderer.dispose();
        }

        coverTexture.dispose();
        leftPageTexture.dispose();
        rightPageTexture.dispose();
        particleTexture.dispose();
        backCoverGeo.dispose();
        pagesBlockGeo.dispose();
        spineGeo.dispose();
        frontCoverGeo.dispose();
        beamGeo.dispose();
        goldBeamGeo.dispose();
        partGeo.dispose();
      };
    } catch (err) {
      console.warn('3D Book Transition WebGL initialization fallback:', err);
      handleFinish();
    }
  }, []);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950 flex flex-col items-center justify-between select-none">
      {/* 3D WebGL Canvas Viewport */}
      <div ref={mountRef} className="absolute inset-0 z-10 w-full h-full" />

      {/* Top Bar with Skip Button */}
      <div className="relative z-30 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700/60 backdrop-blur-md text-xs text-slate-300">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
          <span className="font-mono uppercase tracking-wider text-[11px]">Knowledge Synchronizer</span>
        </div>

        <button
          onClick={handleFinish}
          className="px-4 py-1.5 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-500 backdrop-blur-md text-xs text-slate-300 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 shadow-lg group"
        >
          <span>Skip</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Bottom Status Heading */}
      <div className="relative z-30 pb-12 text-center space-y-2 pointer-events-none animate-fadeIn">
        <h2 className="text-xl sm:text-2xl font-semibold text-white tracking-tight drop-shadow-[0_0_20px_rgba(56,189,248,0.5)]">
          {title}
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 font-normal max-w-md mx-auto">
          {subtitle}
        </p>
      </div>

      {/* Full-Screen Dissolve Flare Bloom */}
      <div
        className={`fixed inset-0 z-40 bg-gradient-to-t from-slate-950 via-indigo-950/90 to-blue-900/40 pointer-events-none transition-opacity duration-500 ${
          fadeWhite ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
};
