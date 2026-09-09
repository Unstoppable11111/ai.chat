"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

interface QuantumRadar3DProps {
  score?: number;
  marketState?: string;
}

/**
 * 全息极光量子引力核心 3D (Aurora Quantum Gravity Core 3D)
 * 专为量化交易决策打造的高端赛博极光全息能量核：
 * - 霓虹青 (Electric Cyan) 与极光绿 (Aurora Emerald) 双层动态引力环高速反向自转
 * - 核心多面体量子晶体晶格发光脉动与能量核呼吸
 * - 64 颗环绕漫游的极光粒子星尘与光晕
 * - 灵敏的视差动态投影与悬浮特技光效
 */
export function QuantumRadar3D({ score = 50, marketState = "震荡蓄势" }: QuantumRadar3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 140;
    const height = container.clientHeight || 120;

    // 1. Scene, Camera, WebGL Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 4.5;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 2. 颜色体系：霓虹青、极光翠绿、纯净星白
    const cyanHex = 0x06b6d4; // cyan-500 赛博青
    const emeraldHex = 0x10b981; // emerald-500 极光绿
    const brightHex = 0x38bdf8; // sky-400 璀璨高光

    const group = new THREE.Group();
    scene.add(group);

    // 3. 外层主星环 (Outer Cyan Ring)
    const outerRingGeo = new THREE.TorusGeometry(1.42, 0.02, 16, 64);
    const outerRingMat = new THREE.MeshBasicMaterial({
      color: cyanHex,
      transparent: true,
      opacity: 0.8,
    });
    const outerRing = new THREE.Mesh(outerRingGeo, outerRingMat);
    group.add(outerRing);

    // 4. 次级倾角极光引力环 (Secondary Tilted Gyro Ring)
    const innerRingGeo = new THREE.TorusGeometry(1.12, 0.016, 16, 64);
    const innerRingMat = new THREE.MeshBasicMaterial({
      color: emeraldHex,
      transparent: true,
      opacity: 0.85,
    });
    const innerRing = new THREE.Mesh(innerRingGeo, innerRingMat);
    innerRing.rotation.x = Math.PI / 3.2;
    innerRing.rotation.y = Math.PI / 6;
    group.add(innerRing);

    // 5. 核心悬浮晶格多面体 (Core Quantum Polyhedron)
    const coreGeo = new THREE.IcosahedronGeometry(0.72, 0);
    const coreMat = new THREE.MeshBasicMaterial({
      color: brightHex,
      wireframe: true,
      transparent: true,
      opacity: 0.85,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    group.add(coreMesh);

    // 内部半透明多面体发光内核 (Inner Facet Glow)
    const innerCoreGeo = new THREE.OctahedronGeometry(0.48, 0);
    const innerCoreMat = new THREE.MeshBasicMaterial({
      color: cyanHex,
      wireframe: true,
      transparent: true,
      opacity: 0.55,
    });
    const innerCoreMesh = new THREE.Mesh(innerCoreGeo, innerCoreMat);
    group.add(innerCoreMesh);

    // 6. 核心能量质心脉冲球 (Radiant Center Energy Sphere)
    const centerGeo = new THREE.SphereGeometry(0.18, 16, 16);
    const centerMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.95,
    });
    const centerMesh = new THREE.Mesh(centerGeo, centerMat);
    group.add(centerMesh);

    // 7. 64 颗极光青与翠绿星云微粒 (Swirling Aurora Star Dust)
    const particleCount = 64;
    const posArr = new Float32Array(particleCount * 3);
    const colorArr = new Float32Array(particleCount * 3);

    const c1 = new THREE.Color(0x06b6d4);
    const c2 = new THREE.Color(0x10b981);

    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const r = 1.35 + (Math.random() - 0.5) * 0.45;
      posArr[i * 3] = Math.cos(angle) * r;
      posArr[i * 3 + 1] = (Math.random() - 0.5) * 0.7;
      posArr[i * 3 + 2] = Math.sin(angle) * r;

      const mixed = i % 2 === 0 ? c1 : c2;
      colorArr[i * 3] = mixed.r;
      colorArr[i * 3 + 1] = mixed.g;
      colorArr[i * 3 + 2] = mixed.b;
    }

    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute("position", new THREE.BufferAttribute(posArr, 3));
    particleGeo.setAttribute("color", new THREE.BufferAttribute(colorArr, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    group.add(particles);

    // 8. 视差悬浮交互
    let targetRotX = 0;
    let targetRotY = 0;
    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      targetRotX = ny * 0.45;
      targetRotY = nx * 0.45;
    };
    window.addEventListener("mousemove", onMouseMove);

    // 9. 动画渲染循环 (特技级脉冲与多维自转)
    let reqId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      reqId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // 多轴高速动态旋转
      outerRing.rotation.z += 0.008;
      outerRing.rotation.x = Math.sin(elapsed * 0.8) * 0.2;

      innerRing.rotation.y += 0.012;
      innerRing.rotation.z -= 0.006;

      coreMesh.rotation.x += 0.01;
      coreMesh.rotation.y += 0.015;

      innerCoreMesh.rotation.x -= 0.015;
      innerCoreMesh.rotation.y -= 0.01;

      particles.rotation.y -= 0.006;

      // 核心呼吸发光缩放 (能量脉动)
      const pulse = 1 + Math.sin(elapsed * 3) * 0.12;
      centerMesh.scale.set(pulse, pulse, pulse);

      // 视差过渡
      group.rotation.x += (targetRotX - group.rotation.x) * 0.08;
      group.rotation.y += (targetRotY - group.rotation.y) * 0.08;

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w > 0 && h > 0) {
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(reqId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", handleResize);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      outerRingGeo.dispose();
      outerRingMat.dispose();
      innerRingGeo.dispose();
      innerRingMat.dispose();
      coreGeo.dispose();
      coreMat.dispose();
      innerCoreGeo.dispose();
      innerCoreMat.dispose();
      centerGeo.dispose();
      centerMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      renderer.dispose();
    };
  }, [score, marketState]);

  return (
    <div className="relative w-full h-28 flex items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-[#0c182b]/80 via-[#08101e]/90 to-[#0e1d35]/80 border border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
      <div ref={containerRef} className="w-full h-full cursor-crosshair pointer-events-auto" />
      <div className="absolute bottom-1.5 left-2.5 flex items-center gap-1.5 pointer-events-none text-[9px] text-cyan-300 font-mono tracking-wider">
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
        AURORA GRAVITY CORE · 3D 全息极光引力核
      </div>
    </div>
  );
}
