import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface PDFScanner3DProps {
  className?: string;
  isScanning?: boolean;
}

export const PDFScanner3D: React.FC<PDFScanner3DProps> = ({
  className = '',
  isScanning = false,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [webglOk, setWebglOk] = useState(true);
  const isScanningRef = useRef(isScanning);

  useEffect(() => {
    isScanningRef.current = isScanning;
  }, [isScanning]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer;
    let animId: number;

    try {
      const width = container.clientWidth || 240;
      const height = container.clientHeight || 180;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
      camera.position.set(0, 0, 8.5);

      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.innerHTML = '';
      container.appendChild(renderer.domElement);

      // 3D Floating Document Sheet
      const docGeo = new THREE.BoxGeometry(2.4, 3.2, 0.08);
      const docMat = new THREE.MeshBasicMaterial({
        color: 0x0f172a,
        wireframe: false,
      });
      const docMesh = new THREE.Mesh(docGeo, docMat);
      scene.add(docMesh);

      // Document Edge Wireframe Outline
      const wireMat = new THREE.MeshBasicMaterial({
        color: 0x334155,
        wireframe: true,
      });
      const wireMesh = new THREE.Mesh(docGeo, wireMat);
      docMesh.add(wireMesh);

      // Internal Content Lines (like text lines on document)
      const linesGroup = new THREE.Group();
      for (let i = 0; i < 6; i++) {
        const lineGeo = new THREE.PlaneGeometry(1.8 - (i === 5 ? 0.6 : 0), 0.08);
        const lineMat = new THREE.MeshBasicMaterial({
          color: i === 0 ? 0x3b82f6 : 0x475569,
          transparent: true,
          opacity: 0.8,
        });
        const line = new THREE.Mesh(lineGeo, lineMat);
        line.position.set(i === 5 ? -0.3 : 0, 1.0 - i * 0.4, 0.05);
        linesGroup.add(line);
      }
      docMesh.add(linesGroup);

      // 3D Laser Scanning Bar
      const laserGeo = new THREE.BoxGeometry(2.7, 0.06, 0.12);
      const laserMat = new THREE.MeshBasicMaterial({
        color: 0x3b82f6,
        transparent: true,
        opacity: 0.9,
      });
      const laserMesh = new THREE.Mesh(laserGeo, laserMat);
      scene.add(laserMesh);

      // Laser Glow Curtain
      const curtainGeo = new THREE.PlaneGeometry(2.7, 0.4);
      const curtainMat = new THREE.MeshBasicMaterial({
        color: 0x3b82f6,
        transparent: true,
        opacity: 0.25,
        side: THREE.DoubleSide,
      });
      const curtainMesh = new THREE.Mesh(curtainGeo, curtainMat);
      laserMesh.add(curtainMesh);

      // Floating Data Particles (Rising up)
      const particleCount = 28;
      const partGeo = new THREE.BufferGeometry();
      const positions = new Float32Array(particleCount * 3);
      for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 3;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 3.5;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 1.5;
      }
      partGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const partMat = new THREE.PointsMaterial({
        size: 0.08,
        color: 0x93c5fd,
        transparent: true,
        opacity: 0.8,
      });
      const particles = new THREE.Points(partGeo, partMat);
      scene.add(particles);

      let clock = new THREE.Clock();

      const render = () => {
        animId = requestAnimationFrame(render);
        const t = clock.getElapsedTime();
        const scanning = isScanningRef.current;

        const scanSpeed = scanning ? 3.5 : 1.5;

        // Subtle document floating & rotation
        docMesh.rotation.y = Math.sin(t * 0.8) * 0.25;
        docMesh.rotation.x = 0.1 + Math.cos(t * 0.6) * 0.1;
        docMesh.position.y = Math.sin(t * 1.2) * 0.15;

        // Laser scan movement
        const laserY = Math.sin(t * scanSpeed) * 1.5;
        laserMesh.position.y = docMesh.position.y + laserY;
        laserMesh.position.z = docMesh.position.z + 0.1;
        laserMesh.rotation.y = docMesh.rotation.y;
        laserMesh.rotation.x = docMesh.rotation.x;

        // Update rising particles
        const posArr = partGeo.attributes.position.array as Float32Array;
        for (let i = 0; i < particleCount; i++) {
          posArr[i * 3 + 1] += 0.015;
          if (posArr[i * 3 + 1] > 2.2) {
            posArr[i * 3 + 1] = -2.0;
          }
        }
        partGeo.attributes.position.needsUpdate = true;

        renderer.render(scene, camera);
      };

      render();

      const handleResize = () => {
        if (!container) return;
        const w = container.clientWidth || 240;
        const h = container.clientHeight || 180;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };

      window.addEventListener('resize', handleResize);

      return () => {
        cancelAnimationFrame(animId);
        window.removeEventListener('resize', handleResize);
        renderer.dispose();
        docGeo.dispose();
        docMat.dispose();
        wireMat.dispose();
        laserGeo.dispose();
        laserMat.dispose();
        curtainGeo.dispose();
        curtainMat.dispose();
        partGeo.dispose();
        partMat.dispose();
        if (container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
      };
    } catch {
      setWebglOk(false);
    }
  }, []);

  if (!webglOk) return null;

  return (
    <div
      ref={mountRef}
      className={`w-full h-44 flex items-center justify-center pointer-events-none select-none ${className}`}
    />
  );
};
