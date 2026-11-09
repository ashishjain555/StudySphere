import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { ArrowRight, Sparkles, BookOpen, Brain, CheckCircle2, ShieldCheck } from 'lucide-react';

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
  const hudRef = useRef<HTMLDivElement>(null);
  const [fadeWhite, setFadeWhite] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [activeStepText, setActiveStepText] = useState('Aligning Curriculum & Course Vault...');
  const completedRef = useRef(false);

  const handleFinish = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    onComplete();
  };

  // Keyboard shortcut to skip (Escape or Space)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ') {
        handleFinish();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // GSAP HUD Animations & Progress Tracking across 4.8 seconds
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // 1. Entrance of HUD elements
      gsap.from('.hud-top-bar', {
        y: -30,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
      });

      gsap.from('.hud-bottom-card', {
        y: 40,
        opacity: 0,
        duration: 0.9,
        ease: 'power3.out',
        delay: 0.2,
      });

      // 2. Smooth progress bar & percentage counter (0 -> 100 over 4.7s)
      const progressObj = { value: 0 };
      gsap.to(progressObj, {
        value: 100,
        duration: 4.7,
        ease: 'power1.inOut',
        onUpdate: () => {
          const val = Math.round(progressObj.value);
          setProgressPercent(val);

          // Update dynamic steps based on milestone
          if (val < 25) {
            setActiveStepText('Summoning Academic Knowledge Vault...');
          } else if (val < 50) {
            setActiveStepText('Unsealing Verified Syllabus Chapters & Notes...');
          } else if (val < 78) {
            setActiveStepText('Synthesizing Diagnostic Quizzes & AI Neural Engine...');
          } else {
            setActiveStepText('Launching Your StudySphere Workspace...');
          }
        },
      });

      // 3. Subtle pulsing glow around the bottom card
      gsap.to('.hud-glow-pulse', {
        opacity: 0.8,
        repeat: -1,
        yoyo: true,
        duration: 1.4,
        ease: 'sine.inOut',
      });
    }, hudRef);

    return () => ctx.revert();
  }, []);

  // Three.js 3D Cinematic Book Opening Scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let animFrameId: number;
    let renderer: THREE.WebGLRenderer | null = null;

    try {
      const width = window.innerWidth;
      const height = window.innerHeight;

      // 1. Scene, Camera & ACES Filmic Renderer
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1000);
      camera.position.set(0, 1.4, 25);
      camera.lookAt(0, 0, 0);

      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.25;
      container.appendChild(renderer.domElement);

      // 2. Cinematic Lighting Setup
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
      scene.add(ambientLight);

      // Warm directional key light
      const keyLight = new THREE.DirectionalLight(0xfff3db, 2.8);
      keyLight.position.set(7, 14, 16);
      scene.add(keyLight);

      // Dramatic blue/indigo rim light
      const rimLight = new THREE.DirectionalLight(0x60a5fa, 2.2);
      rimLight.position.set(-10, -5, -8);
      scene.add(rimLight);

      // Internal Golden Book Core Glow
      const bookCoreLight = new THREE.PointLight(0xfef08a, 0.1, 35);
      bookCoreLight.position.set(0, 0.6, 0);
      scene.add(bookCoreLight);

      // Dynamic floating light that tracks the camera
      const cameraLight = new THREE.PointLight(0xa855f7, 1.5, 20);
      cameraLight.position.set(0, 2, 22);
      scene.add(cameraLight);

      // 3. Texture Generators
      // 3A. Hardcover 24K Gold Debossed Cover Texture
      const createRealisticCoverTexture = () => {
        const cv = document.createElement('canvas');
        cv.width = 1024;
        cv.height = 1400;
        const ctx = cv.getContext('2d');
        if (!ctx) return new THREE.Texture();

        // Midnight obsidian gradient
        const bgGrad = ctx.createLinearGradient(0, 0, 1024, 1400);
        bgGrad.addColorStop(0, '#090d16');
        bgGrad.addColorStop(0.35, '#0f172a');
        bgGrad.addColorStop(0.75, '#1e1b4b');
        bgGrad.addColorStop(1, '#020617');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, 1024, 1400);

        // Linen cloth micro-weave texture
        ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
        for (let y = 0; y < 1400; y += 4) {
          ctx.fillRect(0, y, 1024, 1.5);
        }
        for (let x = 0; x < 1024; x += 4) {
          ctx.fillRect(x, 0, 1.5, 1400);
        }

        // Deep debossed border frame
        ctx.strokeStyle = '#020617';
        ctx.lineWidth = 18;
        ctx.strokeRect(36, 36, 952, 1328);

        // 24K Polished Metallic Gold Foil Borders
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 6;
        ctx.strokeRect(62, 62, 900, 1276);

        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(76, 76, 872, 1248);

        // Ornate Corner Victorian Flourishes
        const drawFlourish = (cx: number, cy: number, rot: number) => {
          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(rot);
          ctx.strokeStyle = '#fde047';
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.arc(32, 32, 22, 0, Math.PI * 1.5);
          ctx.stroke();

          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(42, 42, 14, 0, Math.PI * 1.5);
          ctx.stroke();
          ctx.restore();
        };

        drawFlourish(85, 85, 0);
        drawFlourish(939, 85, Math.PI / 2);
        drawFlourish(939, 1315, Math.PI);
        drawFlourish(85, 1315, -Math.PI / 2);

        // Center Seal & Typography
        const cx = 512;
        const cy = 520;

        // Outer Golden Halo Ring
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(cx, cy, 145, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, 130, 0, Math.PI * 2);
        ctx.stroke();

        // Stylized StudySphere 3D Emblem in Gold
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(cx, cy - 18, 42, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(cx, cy - 18, 28, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(cx, cy - 18, 14, 0, Math.PI * 2);
        ctx.fill();

        // Title: STUDYSPHERE in classic book serif
        ctx.fillStyle = '#f8fafc';
        ctx.font = '700 58px "Cinzel", "Times New Roman", Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillText('STUDYSPHERE', cx, 830);

        ctx.fillStyle = '#fbbf24';
        ctx.font = '600 24px monospace';
        ctx.fillText('• ACADEMIC WORKSPACE •', cx, 885);

        ctx.fillStyle = '#94a3b8';
        ctx.font = 'italic 22px Georgia, serif';
        ctx.fillText('Curriculum & Knowledge Vault', cx, 940);

        return new THREE.CanvasTexture(cv);
      };

      // 3B. Ivory Paper Page Texture
      const createRealisticPageTexture = (side: 'left' | 'right') => {
        const cv = document.createElement('canvas');
        cv.width = 800;
        cv.height = 1100;
        const ctx = cv.getContext('2d');
        if (!ctx) return new THREE.Texture();

        // Cream natural ivory paper
        ctx.fillStyle = '#fefcf3';
        ctx.fillRect(0, 0, 800, 1100);

        // Subtle paper fiber grain
        ctx.fillStyle = 'rgba(0, 0, 0, 0.018)';
        for (let i = 0; i < 2400; i++) {
          ctx.fillRect(Math.random() * 800, Math.random() * 1100, 1.5, 1.5);
        }

        // Inner margin line
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.07)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(70, 60);
        ctx.lineTo(70, 1040);
        ctx.stroke();

        // Top Header
        ctx.fillStyle = '#475569';
        ctx.font = 'italic 20px Georgia, serif';
        ctx.fillText(
          side === 'left' ? 'StudySphere Academic Platform' : 'Chapter 1: Foundations of Mastery',
          90,
          85
        );

        // Page number
        ctx.font = '16px monospace';
        ctx.fillText(side === 'left' ? '12' : '13', side === 'left' ? 90 : 700, 1040);

        // Main Headings & Content
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 28px Georgia, serif';
        ctx.fillText(side === 'left' ? 'Structured Mastery' : 'Cognitive Recall & Retention', 90, 150);

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
          'Key Retentive Formula:',
          '   R(t) = e^(-t / S)  •  Mastery Threshold >= 90%',
          '   ∇ × E = -∂B/∂t    •  Quantum State Vectors: |ψ⟩',
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

      // 3C. Radiant Star Particle Texture
      const createStarTexture = () => {
        const cv = document.createElement('canvas');
        cv.width = 64;
        cv.height = 64;
        const ctx = cv.getContext('2d');
        if (!ctx) return new THREE.Texture();

        const cx = 32;
        const cy = 32;

        const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 30);
        glow.addColorStop(0, 'rgba(255, 255, 255, 1)');
        glow.addColorStop(0.25, 'rgba(253, 224, 71, 0.95)');
        glow.addColorStop(0.65, 'rgba(56, 189, 248, 0.4)');
        glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, 64, 64);

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
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

      // 4. Realistic 3D Book Construction
      const bookMasterGroup = new THREE.Group();
      scene.add(bookMasterGroup);

      const bookW = 6.4;
      const bookH = 8.8;
      const bookThick = 0.95;
      const coverT = 0.15;

      const clothMat = new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        roughness: 0.65,
        metalness: 0.2,
      });

      const coverFrontMat = new THREE.MeshStandardMaterial({
        map: coverTexture,
        roughness: 0.4,
        metalness: 0.3,
      });

      const insideCoverMat = new THREE.MeshStandardMaterial({
        map: leftPageTexture,
        roughness: 0.6,
      });

      const goldFoilMat = new THREE.MeshStandardMaterial({
        color: 0xfbbf24,
        metalness: 0.9,
        roughness: 0.2,
      });

      const gildedEdgesMat = new THREE.MeshStandardMaterial({
        color: 0xfef08a,
        roughness: 0.3,
        metalness: 0.8,
      });

      // Back Cover
      const backCoverGeo = new THREE.BoxGeometry(bookW, bookH, coverT);
      const backCover = new THREE.Mesh(backCoverGeo, [
        clothMat,
        clothMat,
        clothMat,
        clothMat,
        insideCoverMat,
        coverFrontMat,
      ]);
      backCover.position.set(bookW / 2 - 0.1, 0, -bookThick / 2);
      bookMasterGroup.add(backCover);

      // Book Paper Block with Gilded Golden Edges
      const pagesBlockGeo = new THREE.BoxGeometry(bookW - 0.25, bookH - 0.25, bookThick);
      const topPageMat = new THREE.MeshStandardMaterial({
        map: rightPageTexture,
        roughness: 0.6,
      });
      const pagesBlock = new THREE.Mesh(pagesBlockGeo, [
        gildedEdgesMat,
        clothMat,
        gildedEdgesMat,
        gildedEdgesMat,
        topPageMat,
        insideCoverMat,
      ]);
      pagesBlock.position.set((bookW - 0.25) / 2, 0, 0);
      bookMasterGroup.add(pagesBlock);

      // Curved Spine with Raised Classic Bands
      const spineGeo = new THREE.CylinderGeometry(
        bookThick / 2 + 0.04,
        bookThick / 2 + 0.04,
        bookH,
        28,
        1,
        false,
        Math.PI * 0.5,
        Math.PI
      );
      const spine = new THREE.Mesh(spineGeo, clothMat);
      spine.position.set(0, 0, 0);
      spine.rotation.y = Math.PI * 0.5;
      bookMasterGroup.add(spine);

      for (let i = -1.6; i <= 1.6; i += 0.8) {
        const ribGeo = new THREE.TorusGeometry(bookThick / 2 + 0.05, 0.035, 12, 28, Math.PI);
        const rib = new THREE.Mesh(ribGeo, goldFoilMat);
        rib.position.set(0, i * 2.2, 0);
        rib.rotation.y = Math.PI * 0.5;
        bookMasterGroup.add(rib);
      }

      // Front Cover Pivot at the Spine (x = 0)
      const frontCoverPivot = new THREE.Group();
      frontCoverPivot.position.set(0, 0, bookThick / 2);
      bookMasterGroup.add(frontCoverPivot);

      const frontCoverMesh = new THREE.Mesh(backCoverGeo, [
        goldFoilMat,
        clothMat,
        goldFoilMat,
        goldFoilMat,
        coverFrontMat,
        insideCoverMat,
      ]);
      frontCoverMesh.position.set(bookW / 2, 0, 0);
      frontCoverPivot.add(frontCoverMesh);

      // 5. 8 Individual Flipping Parchment Pages
      const pageCount = 8;
      const flippingPages: {
        pivot: THREE.Group;
        targetAngle: number;
        delay: number;
        speed: number;
      }[] = [];

      for (let i = 0; i < pageCount; i++) {
        const pPivot = new THREE.Group();
        pPivot.position.set(0, 0, bookThick / 2 - 0.05 - i * 0.035);
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
          targetAngle: -Math.PI * 0.9 - i * 0.015,
          delay: 2.1 + i * 0.14,
          speed: 1.8,
        });
      }

      // 6. Magical Vortex Starfield System (450 Sparkling Stars)
      const starCount = 450;
      const starGeo = new THREE.BufferGeometry();
      const sPositions = new Float32Array(starCount * 3);
      const sVelocities = new Float32Array(starCount * 3);
      const sColors = new Float32Array(starCount * 3);
      const sAngles = new Float32Array(starCount);

      const starPalette = [
        new THREE.Color('#fde047'), // Vibrant Golden Star
        new THREE.Color('#ffffff'), // Diamond White
        new THREE.Color('#38bdf8'), // Sky Blue
        new THREE.Color('#fbbf24'), // Warm Amber
        new THREE.Color('#c084fc'), // Soft Lavender Sparkle
        new THREE.Color('#34d399'), // Emerald Sparkle
      ];

      for (let i = 0; i < starCount; i++) {
        sPositions[i * 3] = 1.5 + (Math.random() - 0.5) * 4;
        sPositions[i * 3 + 1] = (Math.random() - 0.5) * 3;
        sPositions[i * 3 + 2] = (Math.random() - 0.5) * 2;

        const angle = Math.random() * Math.PI * 2;
        sAngles[i] = angle;
        const radialSpeed = 0.03 + Math.random() * 0.06;
        sVelocities[i * 3] = Math.cos(angle) * radialSpeed;
        sVelocities[i * 3 + 1] = 0.03 + Math.random() * 0.08;
        sVelocities[i * 3 + 2] = 0.04 + Math.random() * 0.09;

        const col = starPalette[i % starPalette.length];
        sColors[i * 3] = col.r;
        sColors[i * 3 + 1] = col.g;
        sColors[i * 3 + 2] = col.b;
      }

      starGeo.setAttribute('position', new THREE.BufferAttribute(sPositions, 3));
      starGeo.setAttribute('color', new THREE.BufferAttribute(sColors, 3));

      const starMaterial = new THREE.PointsMaterial({
        size: 1.1,
        map: starTexture,
        vertexColors: true,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });

      const starField = new THREE.Points(starGeo, starMaterial);
      scene.add(starField);

      // 7. Initial Offscreen Placement for Aerodynamic Entrance
      const startX = 24;
      const startY = -12;
      const startZ = -8;

      bookMasterGroup.position.set(startX, startY, startZ);
      bookMasterGroup.rotation.set(0.5, 0.8, -0.4);

      const clock = new THREE.Clock();
      let hasCompleted = false;

      // 8. 4.8 SECONDS MASTER CINEMATIC TIMELINE LOOP
      const animate = () => {
        animFrameId = requestAnimationFrame(animate);
        const elapsed = clock.getElapsedTime();

        // PHASE 1: Graceful Aerodynamic Flight Entrance (0.0s - 1.3s)
        if (elapsed < 1.3) {
          const t = elapsed / 1.3;
          const ease = 1 - Math.pow(1 - t, 4); // Quintic deceleration

          bookMasterGroup.position.x = startX * (1 - ease);
          bookMasterGroup.position.y = startY * (1 - ease);
          bookMasterGroup.position.z = startZ * (1 - ease) + 2.2;

          bookMasterGroup.rotation.x = 0.5 * (1 - ease) + 0.32;
          bookMasterGroup.rotation.y = 0.8 * (1 - ease) - 0.25;
          bookMasterGroup.rotation.z = -0.4 * (1 - ease) - 0.04;
        } else {
          // Floating idle breathing animation
          bookMasterGroup.position.x = 0;
          bookMasterGroup.position.y = Math.sin(elapsed * 2.2) * 0.16;
          bookMasterGroup.position.z = 2.2;
        }

        // PHASE 2: Gilded Cover Opens Elegantly (1.3s - 2.3s)
        if (elapsed >= 1.3) {
          const coverProgress = Math.min((elapsed - 1.3) / 1.0, 1);
          const easeCover = 1 - Math.pow(1 - coverProgress, 3);
          const targetCoverAngle = -Math.PI * 0.94; // ~170 degrees open
          frontCoverPivot.rotation.y = easeCover * targetCoverAngle;

          // Book glow intensifies as cover unseals
          bookCoreLight.intensity = easeCover * 18;
          starMaterial.opacity = Math.min(easeCover * 1.3, 1);
        }

        // PHASE 3: 8 Individual Parchment Pages Flip Staggered (2.1s - 3.4s)
        flippingPages.forEach((p) => {
          if (elapsed >= p.delay) {
            const pageProgress = Math.min((elapsed - p.delay) / 0.65, 1);
            const easePage = 1 - Math.pow(1 - pageProgress, 2.8);
            p.pivot.rotation.y = easePage * p.targetAngle;
          }
        });

        // PHASE 4: Sparkling Vortex Spiral Stream (from 1.6s onwards)
        if (elapsed >= 1.6) {
          const positions = starGeo.attributes.position.array as Float32Array;
          for (let i = 0; i < starCount; i++) {
            sAngles[i] += 0.035;

            // Spiral vortex mathematics
            positions[i * 3] += sVelocities[i * 3] + Math.cos(sAngles[i]) * 0.04;
            positions[i * 3 + 1] += sVelocities[i * 3 + 1] + Math.sin(sAngles[i]) * 0.03;
            positions[i * 3 + 2] += sVelocities[i * 3 + 2];

            // Re-spawn star once it flies past the camera
            if (positions[i * 3 + 2] > 24) {
              positions[i * 3] = 1.4 + (Math.random() - 0.5) * 3;
              positions[i * 3 + 1] = (Math.random() - 0.5) * 2;
              positions[i * 3 + 2] = (Math.random() - 0.5) * 2;
            }
          }
          starGeo.attributes.position.needsUpdate = true;
        }

        // PHASE 5: Cinematic Dolly Zoom into Knowledge Core (3.7s - 4.65s)
        if (elapsed >= 3.7) {
          const diveProgress = Math.min((elapsed - 3.7) / 0.95, 1);
          const easeDive = Math.pow(diveProgress, 2.5);

          camera.position.z = 25 - easeDive * 20;
          camera.position.y = 1.4 - easeDive * 1.0;

          if (diveProgress > 0.6 && !fadeWhite) {
            setFadeWhite(true);
          }
        }

        // PHASE 6: Finish Transition and Launch Dashboard (4.8s)
        if (elapsed >= 4.8 && !hasCompleted) {
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

      // Memory Disposal & WebGL Cleanup
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
        starGeo.dispose();
      };
    } catch (err) {
      console.warn('3D Book Transition WebGL initialization fallback:', err);
      handleFinish();
    }
  }, []);

  return (
    <div
      ref={hudRef}
      className="fixed inset-0 z-50 overflow-hidden bg-slate-950 flex flex-col items-center justify-between select-none"
    >
      {/* 3D WebGL Canvas Layer */}
      <div ref={mountRef} className="absolute inset-0 z-10 w-full h-full" />

      {/* Ambient Radial Gradient Halo */}
      <div className="absolute inset-0 bg-radial-gradient from-indigo-900/20 via-transparent to-slate-950 pointer-events-none z-0" />

      {/* TOP HUD BAR */}
      <div className="hud-top-bar relative z-30 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-slate-700/60 backdrop-blur-md text-xs text-slate-300 shadow-xl">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
          <span className="font-mono uppercase tracking-wider text-[11px] font-medium text-slate-200">
            StudySphere Tome • 3D Sequence
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-[11px] font-mono text-slate-500">
            Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">Esc</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">Space</kbd>
          </span>
          <button
            onClick={handleFinish}
            className="px-4 py-1.5 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-500 backdrop-blur-md text-xs text-slate-300 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 shadow-lg group hover:scale-105 active:scale-95"
          >
            <span>Skip</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* BOTTOM HUD CARD & PROGRESS STORYTELLING */}
      <div className="hud-bottom-card relative z-30 pb-10 px-4 w-full max-w-lg mx-auto text-center space-y-3 pointer-events-none">
        {/* Glowing Halo behind card */}
        <div className="hud-glow-pulse absolute -inset-2 bg-gradient-to-r from-blue-600/20 via-purple-600/25 to-amber-500/20 rounded-3xl blur-xl opacity-50 -z-10" />

        <div className="p-5 rounded-2xl bg-slate-900/85 border border-slate-800/90 backdrop-blur-xl shadow-2xl space-y-3">
          {/* Main Title */}
          <div className="flex items-center justify-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-400 animate-pulse" />
            <h2 className="text-xl sm:text-2xl font-semibold text-white tracking-tight drop-shadow-[0_0_20px_rgba(251,191,36,0.35)]">
              {title}
            </h2>
          </div>

          {/* Dynamic Storytelling Step */}
          <p className="text-xs sm:text-sm text-slate-300 font-medium min-h-[20px] transition-all">
            {activeStepText}
          </p>

          {/* Progress Bar Container */}
          <div className="space-y-1.5 pt-1">
            <div className="w-full h-1.5 rounded-full bg-slate-800/80 overflow-hidden border border-slate-700/40">
              <div
                className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-amber-400 rounded-full transition-all duration-150 ease-out shadow-[0_0_12px_rgba(99,102,241,0.8)]"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>Initializing Workspace</span>
              <span className="text-amber-300 font-semibold">{progressPercent}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Final Supernova White/Gold Dissolve Bloom */}
      <div
        className={`fixed inset-0 z-40 bg-gradient-to-t from-slate-950 via-slate-900/90 to-indigo-950/60 pointer-events-none transition-opacity duration-600 ${
          fadeWhite ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
};
