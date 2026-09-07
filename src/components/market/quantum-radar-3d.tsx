"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

interface QuantumRadar3DProps {
  score?: number;
  marketState?: string;
}

export function QuantumRadar3D({ score = 50, marketState = "震荡蓄势" }: QuantumRadar3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 160;
    const height = container.clientHeight || 140;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 主题色彩计算（红涨绿跌 / 情绪打分）
    const isBull = score >= 60;
    const isBear = score < 40;
    const primaryColor = isBull ? 0x10b981 : isBear ? 0xf43f5e : 0x06b6d4; // 绿(涨)/红(跌)/青蓝(震荡)
    const secondaryColor = isBull ? 0x06b6d4 : isBear ? 0xa855f7 : 0xf59e0b;

    // 2. 内层 3D 多面体线框 (Quantum Core)
    const coreGeo = new THREE.IcosahedronGeometry(1.2, 1);
    const coreMat = new THREE.MeshBasicMaterial({
      color: primaryColor,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    scene.add(coreMesh);

    // 3. 核心发光质点球
    const nucleusGeo = new THREE.SphereGeometry(0.45, 16, 16);
    const nucleusMat = new THREE.MeshBasicMaterial({
      color: secondaryColor,
      wireframe: true,
      transparent: true,
      opacity: 0.7,
    });
    const nucleusMesh = new THREE.Mesh(nucleusGeo, nucleusMat);
    scene.add(nucleusMesh);

    // 4. 外层动态量子粒子星环 (Orbital Particle Rings)
    const particleCount = 180;
    const posArray = new Float32Array(particleCount * 3);
    const colorArray = new Float32Array(particleCount * 3);
    const p1 = new THREE.Color(primaryColor);
    const p2 = new THREE.Color(secondaryColor);

    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const radius = 1.8 + (Math.random() - 0.5) * 0.4;
      const x = Math.cos(angle) * radius;
      const y = (Math.random() - 0.5) * 0.6;
      const z = Math.sin(angle) * radius;

      posArray[i * 3] = x;
      posArray[i * 3 + 1] = y;
      posArray[i * 3 + 2] = z;

      const mixed = p1.clone().lerp(p2, Math.random());
      colorArray[i * 3] = mixed.r;
      colorArray[i * 3 + 1] = mixed.g;
      colorArray[i * 3 + 2] = mixed.b;
    }

    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute("position", new THREE.BufferAttribute(posArray, 3));
    particleGeo.setAttribute("color", new THREE.BufferAttribute(colorArray, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
    });
    const particleSystem = new THREE.Points(particleGeo, particleMat);
    scene.add(particleSystem);

    // 5. 交互与动画循环
    let mouseX = 0;
    let mouseY = 0;
    let frameId: number;

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    };
    container.addEventListener("mousemove", onMouseMove);

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w > 0 && h > 0) {
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }
    };
    window.addEventListener("resize", onResize);

    let clock = new THREE.Clock();

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();
      const rotSpeed = 0.008 + (score / 100) * 0.015;

      // 核心多面体与粒子自转
      coreMesh.rotation.x += rotSpeed * 0.7;
      coreMesh.rotation.y += rotSpeed;
      nucleusMesh.rotation.y -= rotSpeed * 1.5;
      particleSystem.rotation.y += rotSpeed * 0.5;
      particleSystem.rotation.z = Math.sin(elapsedTime * 0.5) * 0.2;

      // 呼吸脉冲缩放
      const pulse = 1 + Math.sin(elapsedTime * 2.5) * 0.06;
      coreMesh.scale.set(pulse, pulse, pulse);

      // 鼠标轻微微动跟随
      camera.position.x += (mouseX * 0.6 - camera.position.x) * 0.05;
      camera.position.y += (mouseY * 0.6 - camera.position.y) * 0.05;
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", onResize);
      container.removeEventListener("mousemove", onMouseMove);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      coreGeo.dispose();
      coreMat.dispose();
      nucleusGeo.dispose();
      nucleusMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      renderer.dispose();
    };
  }, [score, marketState]);

  return (
    <div className="relative w-full h-32 flex items-center justify-center overflow-hidden rounded-xl bg-slate-950/40 border border-slate-800/60 shadow-inner">
      <div ref={containerRef} className="w-full h-full cursor-crosshair" />
      <div className="absolute bottom-1.5 left-2.5 flex items-center gap-1.5 pointer-events-none text-[10px] text-cyan-400/80 font-mono tracking-wider">
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
        QUANTUM 3D CORE
      </div>
    </div>
  );
}
