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
  title = 'Welcome to StudySphere',
  subtitle = 'Opening your personalized study workspace...',
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

      // 1. Scene & Camera Setup
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
      camera.position.set(0, 1.5, 23);
      camera.lookAt(0, 0, 0);

      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;
      container.appendChild(renderer.domElement);

      // 2. Realistic Ambient & Studio Lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
      scene.add(ambientLight);

      // Warm directional key light
      const keyLight = new THREE.DirectionalLight(0xfff8ed, 2.5);
      keyLight.position.set(6, 12, 14);
      scene.add(keyLight);

      // Soft cool rim light from behind
      const rimLight = new THREE.DirectionalLight(0x93c5fd, 1.8);
      rimLight.position.set(-8, -4, -6);
      scene.add(rimLight);

      // Warm internal book glow light
      const bookGlowLight = new THREE.PointLight(0xfef08a, 0.1, 25);
      bookGlowLight.position.set(0, 0.5, 0);
      scene.add(bookGlowLight);

      // 3. Realistic Texture Generator: Hardcover Book Cloth & Gold Lettering
      const createRealisticCoverTexture = () => {
        const cv = document.createElement('canvas');
        cv.width = 1024;
        cv.height = 1400;
        const ctx = cv.getContext('2d');
        if (!ctx) return new THREE.Texture();

        // Rich Oxford Navy book cloth background
        const bgGrad = ctx.createLinearGradient(0, 0, 1024, 1400);
        bgGrad.addColorStop(0, '#0f172a'); // Slate 900
        bgGrad.addColorStop(0.5, '#1e293b'); // Slate 800
        bgGrad.addColorStop(1, '#090d16');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, 1024, 1400);

        // Realistic book cloth weave / linen texture
        ctx.fillStyle = 'rgba(255, 255, 255, 0.035)';
        for (let y = 0; y < 1400; y += 4) {
          ctx.fillRect(0, y, 1024, 1.5);
        }
        for (let x = 0; x < 1024; x += 4) {
          ctx.fillRect(x, 0, 1.5, 1400);
        }

        // Blind debossed outer border groove
        ctx.strokeStyle = '#020617';
        ctx.lineWidth = 16;
        ctx.strokeRect(40, 40, 944, 1320);

        // Elegant metallic gold foil inner border
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 6;
        ctx.strokeRect(65, 65, 894, 1270);

        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.strokeRect(78, 78, 868, 1244);

        // Ornate corner flourishes
        const drawFlourish = (cx: number, cy: number, rot: number) => {
          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(rot);
          ctx.strokeStyle = '#fde047';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(30, 30, 20, 0, Math.PI * 1.5);
          ctx.stroke();
          ctx.restore();
        };

        drawFlourish(85, 85, 0);
        drawFlourish(939, 85, Math.PI / 2);
        drawFlourish(939, 1315, Math.PI);
        drawFlourish(85, 1315, -Math.PI / 2);

        // Center Gold Embossed Crest & Typography
        const cx = 512;
        const cy = 520;

        // Circular Emblem
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(cx, cy, 140, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, 126, 0, Math.PI * 2);
        ctx.stroke();

        // Stylized StudySphere Icon in Gold Foil
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(cx, cy - 15, 36, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(cx, cy - 15, 24, 0, Math.PI * 2);
        ctx.fill();

        // Title: STUDYSPHERE in classic book serif
        ctx.fillStyle = '#f8fafc';
        ctx.font = '600 58px "Cinzel", "Times New Roman", Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillText('STUDYSPHERE', cx, 820);

        ctx.fillStyle = '#fbbf24';
        ctx.font = '500 24px monospace';
        ctx.fillText('• ACADEMIC WORKSPACE •', cx, 875);

        ctx.fillStyle = '#94a3b8';
        ctx.font = 'italic 22px Georgia, serif';
        ctx.fillText('Curriculum & Knowledge Vault', cx, 930);

        return new THREE.CanvasTexture(cv);
      };

      // 4. Realistic Texture Generator: Natural Paper Pages
      const createRealisticPageTexture = (side: 'left' | 'right') => {
        const cv = document.createElement('canvas');
        cv.width = 800;
        cv.height = 1100;
        const ctx = cv.getContext('2d');
        if (!ctx) return new THREE.Texture();

        // Cream natural ivory acid-free book paper
        ctx.fillStyle = '#fefcf3';
        ctx.fillRect(0, 0, 800, 1100);

        // Subtle paper grain
        ctx.fillStyle = 'rgba(0, 0, 0, 0.015)';
        for (let i = 0; i < 2000; i++) {
          ctx.fillRect(Math.random() * 800, Math.random() * 1100, 1.5, 1.5);
        }

        // Inner margin guideline
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.06)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(70, 60);
        ctx.lineTo(70, 1040);
        ctx.stroke();

        // Header
        ctx.fillStyle = '#475569';
        ctx.font = 'italic 20px Georgia, serif';
        ctx.fillText(side === 'left' ? 'StudySphere Academic Platform' : 'Chapter 1: Knowledge Foundations', 90, 85);

        // Page number
        ctx.font = '16px monospace';
        ctx.fillText(side === 'left' ? '12' : '13', side === 'left' ? 90 : 700, 1040);

        // Realistic book paragraphs & formulas
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 28px Georgia, serif';
        ctx.fillText(side === 'left' ? 'Structured Mastery' : 'Continuous Retention', 90, 150);

        ctx.fillStyle = '#334155';
        ctx.font = '17px/1.6 Georgia, serif';
        const lines = [
          'Effective study workflows require precise alignment with',
          'curriculum objectives and consistent cognitive recall.',
          '',
          'By transforming unstructured notes into active diagnostic',
          'quizzes and interactive flashcards, learners achieve',
          'measurable milestones across every semester topic.',
          '',
          'Key Retentive Equation:',
          '   R(t) = e^(-t / S)  •  Mastery Threshold >= 90%',
          '',
          'Active learning units initialized:',
          '  [✓] Verified Curriculum Syllabus Modules',
          '  [✓] Intelligent Study Tutor Depths Configured',
          '  [✓] Comprehensive Diagnostic Analytics Active',
        ];

        let lineY = 220;
        for (const line of lines) {
          ctx.fillText(line, 90, lineY);
          lineY += 34;
        }

        return new THREE.CanvasTexture(cv);
      };

      // 5. Realistic Star Particle Texture (Twinkling 4-Pointed Star)
      const createStarTexture = () => {
        const cv = document.createElement('canvas');
        cv.width = 64;
        cv.height = 64;
        const ctx = cv.getContext('2d');
        if (!ctx) return new THREE.Texture();

        const cx = 32;
        const cy = 32;

        // Radial glow
        const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 30);
        glow.addColorStop(0, 'rgba(255, 255, 255, 1)');
        glow.addColorStop(0.2, 'rgba(253, 224, 71, 0.9)'); // Gold yellow
        glow.addColorStop(0.6, 'rgba(56, 189, 248, 0.3)'); // Cyan
        glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, 64, 64);

        // Crisp 4-pointed star spikes
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        // Top spike
        ctx.moveTo(cx, cy - 28);
        ctx.quadraticCurveTo(cx, cy, cx + 28, cy);
        ctx.quadraticCurveTo(cx, cy, cx, cy + 28);
        ctx.quadraticCurveTo(cx, cy, cx - 28, cy);
        ctx.quadraticCurveTo(cx, cy, cx, cy - 28);
        ctx.fill();

        return new THREE.CanvasTexture(cv);
      };

      const coverTexture = createRealisticCoverTexture();
      const leftPageTexture = createRealisticPageTexture('left');
      const rightPageTexture = createRealisticPageTexture('right');
      const starTexture = createStarTexture();

      // 6. Realistic 3D Book Assembly
      const bookMasterGroup = new THREE.Group();
      scene.add(bookMasterGroup);

      const bookW = 6.2;
      const bookH = 8.6;
      const bookThick = 0.85;
      const coverT = 0.14;

      const clothMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        roughness: 0.7,
        metalness: 0.15,
      });

      const coverFrontMat = new THREE.MeshStandardMaterial({
        map: coverTexture,
        roughness: 0.45,
        metalness: 0.25,
      });

      const insideCoverMat = new THREE.MeshStandardMaterial({
        map: leftPageTexture,
        roughness: 0.6,
      });

      const goldFoilMat = new THREE.MeshStandardMaterial({
        color: 0xfbbf24,
        metalness: 0.85,
        roughness: 0.25,
      });

      // Realistic Gilded Page Edge Material
      const gildedEdgesMat = new THREE.MeshStandardMaterial({
        color: 0xfef08a,
        roughness: 0.35,
        metalness: 0.7,
      });

      // Back Cover
      const backCoverGeo = new THREE.BoxGeometry(bookW, bookH, coverT);
      const backCover = new THREE.Mesh(backCoverGeo, [
        clothMat, clothMat, clothMat, clothMat,
        insideCoverMat, coverFrontMat,
      ]);
      backCover.position.set(bookW / 2 - 0.1, 0, -bookThick / 2);
      bookMasterGroup.add(backCover);

      // Book Paper Block
      const pagesBlockGeo = new THREE.BoxGeometry(bookW - 0.25, bookH - 0.25, bookThick);
      const topPageMat = new THREE.MeshStandardMaterial({
        map: rightPageTexture,
        roughness: 0.6,
      });
      const pagesBlock = new THREE.Mesh(pagesBlockGeo, [
        gildedEdgesMat, clothMat, gildedEdgesMat, gildedEdgesMat,
        topPageMat, insideCoverMat,
      ]);
      pagesBlock.position.set((bookW - 0.25) / 2, 0, 0);
      bookMasterGroup.add(pagesBlock);

      // Realistic Curved Spine with 4 Raised Ribs
      const spineGeo = new THREE.CylinderGeometry(
        bookThick / 2 + 0.04,
        bookThick / 2 + 0.04,
        bookH,
        24,
        1,
        false,
        Math.PI * 0.5,
        Math.PI
      );
      const spine = new THREE.Mesh(spineGeo, clothMat);
      spine.position.set(0, 0, 0);
      spine.rotation.y = Math.PI * 0.5;
      bookMasterGroup.add(spine);

      // 4 Spine Ribs (Raised classic bookbinding bands)
      for (let i = -1.5; i <= 1.5; i += 1.0) {
        const ribGeo = new THREE.TorusGeometry(bookThick / 2 + 0.05, 0.035, 12, 24, Math.PI);
        const rib = new THREE.Mesh(ribGeo, goldFoilMat);
        rib.position.set(0, i * 2, 0);
        rib.rotation.y = Math.PI * 0.5;
        bookMasterGroup.add(rib);
      }

      // Front Cover Pivot at the Spine (x = 0)
      const frontCoverPivot = new THREE.Group();
      frontCoverPivot.position.set(0, 0, bookThick / 2);
      bookMasterGroup.add(frontCoverPivot);

      const frontCoverGeo = new THREE.BoxGeometry(bookW, bookH, coverT);
      const frontCoverMesh = new THREE.Mesh(frontCoverGeo, [
        goldFoilMat, clothMat, goldFoilMat, goldFoilMat,
        coverFrontMat, insideCoverMat,
      ]);
      frontCoverMesh.position.set(bookW / 2, 0, 0);
      frontCoverPivot.add(frontCoverMesh);

      // 7. Individual Turning Paper Pages
      const pageCount = 6;
      const flippingPages: { pivot: THREE.Group; targetAngle: number; speed: number; delay: number }[] = [];

      for (let i = 0; i < pageCount; i++) {
        const pPivot = new THREE.Group();
        pPivot.position.set(0, 0, (bookThick / 2) - 0.06 - (i * 0.04));
        bookMasterGroup.add(pPivot);

        const pGeo = new THREE.PlaneGeometry(bookW - 0.35, bookH - 0.35);
        const pMat = new THREE.MeshStandardMaterial({
          map: rightPageTexture,
          side: THREE.DoubleSide,
          roughness: 0.6,
        });
        const pMesh = new THREE.Mesh(pGeo, pMat);
        pMesh.position.set((bookW - 0.35) / 2, 0, 0);
        pPivot.add(pMesh);

        flippingPages.push({
          pivot: pPivot,
          targetAngle: -Math.PI * 0.88 - (i * 0.02),
          speed: 2.2,
          delay: 0.85 + (i * 0.12),
        });
      }

      // 8. Dazzling Magical Starfield System (Stars bursting from inside the book)
      const starCount = 280;
      const starGeo = new THREE.BufferGeometry();
      const sPositions = new Float32Array(starCount * 3);
      const sVelocities = new Float32Array(starCount * 3);
      const sColors = new Float32Array(starCount * 3);
      const sSizes = new Float32Array(starCount);

      const starPalette = [
        new THREE.Color('#fde047'), // Vibrant Golden Star
        new THREE.Color('#ffffff'), // Diamond White
        new THREE.Color('#38bdf8'), // Sky Blue
        new THREE.Color('#fbbf24'), // Warm Amber
        new THREE.Color('#c084fc'), // Soft Lavender Sparkle
      ];

      for (let i = 0; i < starCount; i++) {
        // Initial star origin is clustered right inside the open page groove
        sPositions[i * 3] = 1.5 + (Math.random() - 0.5) * 4;
        sPositions[i * 3 + 1] = (Math.random() - 0.5) * 3;
        sPositions[i * 3 + 2] = (Math.random() - 0.5) * 2;

        // Spiral cone velocity exploding upwards and towards camera
        const angle = Math.random() * Math.PI * 2;
        const radialSpeed = 0.04 + Math.random() * 0.07;
        sVelocities[i * 3] = Math.cos(angle) * radialSpeed;
        sVelocities[i * 3 + 1] = 0.04 + Math.random() * 0.09; // Float up
        sVelocities[i * 3 + 2] = 0.03 + Math.random() * 0.08; // Float towards camera

        const col = starPalette[i % starPalette.length];
        sColors[i * 3] = col.r;
        sColors[i * 3 + 1] = col.g;
        sColors[i * 3 + 2] = col.b;

        sSizes[i] = 0.4 + Math.random() * 0.9;
      }

      starGeo.setAttribute('position', new THREE.BufferAttribute(sPositions, 3));
      starGeo.setAttribute('color', new THREE.BufferAttribute(sColors, 3));

      const starMaterial = new THREE.PointsMaterial({
        size: 0.9,
        map: starTexture,
        vertexColors: true,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });

      const starField = new THREE.Points(starGeo, starMaterial);
      scene.add(starField);

      // 9. ANIMATION TIMELINE LOOP
      // The book starts offscreen to the side (Side-Flying Entrance)
      const startX = 22;
      const startY = -10;
      const startZ = -6;

      bookMasterGroup.position.set(startX, startY, startZ);
      bookMasterGroup.rotation.set(0.48, 0.75, -0.42);

      const clock = new THREE.Clock();
      let hasCompleted = false;

      const animate = () => {
        animFrameId = requestAnimationFrame(animate);
        const elapsed = clock.getElapsedTime();

        // PHASE 1: Sassy Side-Flying Flight Path (0.0s - 0.75s)
        // Curves into center with smooth aerodynamic deceleration
        if (elapsed < 0.75) {
          const t = elapsed / 0.75;
          // Quintic ease out for snappy, responsive deceleration
          const ease = 1 - Math.pow(1 - t, 4);

          bookMasterGroup.position.x = startX * (1 - ease) + 0;
          bookMasterGroup.position.y = startY * (1 - ease) + 0;
          bookMasterGroup.position.z = startZ * (1 - ease) + 2.5;

          // Smooth rotation from flying angle into comfortable 3D presentation tilt
          bookMasterGroup.rotation.x = 0.48 * (1 - ease) + 0.35;
          bookMasterGroup.rotation.y = 0.75 * (1 - ease) + -0.28;
          bookMasterGroup.rotation.z = -0.42 * (1 - ease) + -0.05;
        } else {
          // Once in center, subtle gentle floating drift
          bookMasterGroup.position.x = 0;
          bookMasterGroup.position.y = Math.sin(elapsed * 2.8) * 0.18;
          bookMasterGroup.position.z = 2.5;
        }

        // PHASE 2: Cover Opens in 3D (0.75s - 1.55s)
        if (elapsed >= 0.75) {
          const coverProgress = Math.min((elapsed - 0.75) / 0.8, 1);
          // Realistic smooth cubic ease-out
          const easeCover = 1 - Math.pow(1 - coverProgress, 3);
          const targetCoverAngle = -Math.PI * 0.92; // ~165 degrees open
          frontCoverPivot.rotation.y = easeCover * targetCoverAngle;

          // Light glow and star opacity surge as cover opens
          bookGlowLight.intensity = easeCover * 14;
          starMaterial.opacity = Math.min(easeCover * 1.2, 1);
        }

        // PHASE 3: Pages Flip Across One After Another (0.85s - 1.75s)
        flippingPages.forEach((p) => {
          if (elapsed >= p.delay) {
            const pageProgress = Math.min((elapsed - p.delay) / 0.5, 1);
            const easePage = 1 - Math.pow(1 - pageProgress, 2.5);
            p.pivot.rotation.y = easePage * p.targetAngle;
          }
        });

        // PHASE 4: Stars & Sparkles Twinkle & Swirl Towards User (from 0.8s onwards)
        if (elapsed >= 0.8) {
          const positions = starGeo.attributes.position.array as Float32Array;
          for (let i = 0; i < starCount; i++) {
            positions[i * 3] += sVelocities[i * 3];
            positions[i * 3 + 1] += sVelocities[i * 3 + 1];
            positions[i * 3 + 2] += sVelocities[i * 3 + 2];

            // Subtle spiral swirl
            positions[i * 3] += Math.sin(elapsed * 4 + i) * 0.015;

            // Recycle star once it flies past camera
            if (positions[i * 3 + 2] > 22) {
              positions[i * 3] = 1.2 + (Math.random() - 0.5) * 3;
              positions[i * 3 + 1] = (Math.random() - 0.5) * 2;
              positions[i * 3 + 2] = (Math.random() - 0.5) * 2;
            }
          }
          starGeo.attributes.position.needsUpdate = true;
        }

        // PHASE 5: Camera Glides Forward into Star Portal (1.8s - 2.3s)
        if (elapsed >= 1.8) {
          const diveProgress = Math.min((elapsed - 1.8) / 0.5, 1);
          const easeDive = diveProgress * diveProgress;

          camera.position.z = 23 - easeDive * 17;
          camera.position.y = 1.5 - easeDive * 1.2;

          if (diveProgress > 0.45 && !fadeWhite) {
            setFadeWhite(true);
          }
        }

        // PHASE 6: Finish Transition (2.35s)
        if (elapsed >= 2.35 && !hasCompleted) {
          hasCompleted = true;
          handleFinish();
          return;
        }

        if (renderer) {
          renderer.render(scene, camera);
        }
      };

      animate();

      const handleResize = () => {
        if (!container || !renderer) return;
        const newW = window.innerWidth;
        const newH = window.innerHeight;
        camera.aspect = newW / newH;
        camera.updateProjectionMatrix();
        renderer.setSize(newW, newH);
      };
      window.addEventListener('resize', handleResize);

      // Cleanup
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
        starTexture.dispose();
        backCoverGeo.dispose();
        pagesBlockGeo.dispose();
        spineGeo.dispose();
        frontCoverGeo.dispose();
        starGeo.dispose();
      };
    } catch (err) {
      console.warn('3D Book Transition WebGL initialization fallback:', err);
      handleFinish();
    }
  }, []);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950 flex flex-col items-center justify-between select-none">
      {/* 3D WebGL Canvas */}
      <div ref={mountRef} className="absolute inset-0 z-10 w-full h-full" />

      {/* Top Bar with Skip Button */}
      <div className="relative z-30 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700/60 backdrop-blur-md text-xs text-slate-300">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
          <span className="font-mono uppercase tracking-wider text-[11px]">Academic Knowledge Tome</span>
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
        <h2 className="text-xl sm:text-2xl font-semibold text-white tracking-tight drop-shadow-[0_0_20px_rgba(251,191,36,0.4)]">
          {title}
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 font-normal max-w-md mx-auto">
          {subtitle}
        </p>
      </div>

      {/* Full-Screen Dissolve Flare Bloom */}
      <div
        className={`fixed inset-0 z-40 bg-gradient-to-t from-slate-950 via-slate-900/90 to-indigo-950/40 pointer-events-none transition-opacity duration-500 ${
          fadeWhite ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
};
