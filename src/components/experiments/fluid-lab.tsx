"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Sparkles,
  Maximize2,
  Minimize2,
  Sliders,
  RotateCcw,
  Zap,
  Flame,
  Droplets,
  HelpCircle,
} from "lucide-react";

interface ColorPalette {
  name: string;
  colors: string[];
}

const PALETTES: ColorPalette[] = [
  { name: "赛博霓虹", colors: ["#00f0ff", "#ff007f", "#7928ca", "#3b82f6"] },
  { name: "太阳风暴", colors: ["#ff4500", "#ff8c00", "#ffd700", "#ff1493"] },
  { name: "翡翠深渊", colors: ["#00f2fe", "#4facfe", "#00b09b", "#96c93d"] },
  { name: "极光冰洋", colors: ["#a18cd1", "#fbc2eb", "#8ec5fc", "#e0c3fc"] },
  { name: "纯金粒子", colors: ["#f6d365", "#fda085", "#fbc2eb", "#ffffff"] },
];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  maxAge: number;
  size: number;
  color: string;
}

export function FluidLab() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 控制状态
  const [paletteIndex, setPaletteIndex] = useState(0);
  const [viscosity, setViscosity] = useState(0.96); // 粘度/阻尼
  const [particleDensity, setParticleDensity] = useState(12); // 单次划动释放粒子数
  const [vorticityStrength, setVorticityStrength] = useState(1.2); // 涡流扰动
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [fps, setFps] = useState(60);
  const [activeParticles, setActiveParticles] = useState(0);

  // 物理模拟引擎内部引用
  const particlesRef = useRef<Particle[]>([]);
  const pointerRef = useRef({
    x: 0,
    y: 0,
    prevX: 0,
    prevY: 0,
    vx: 0,
    vy: 0,
    isDown: false,
    colorStep: 0,
  });

  const clearCanvas = useCallback(() => {
    particlesRef.current = [];
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#060913";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, []);

  // 触发特定流体特效：爆炸漩涡
  const triggerVortexBurst = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const currentColors = PALETTES[paletteIndex].colors;

    for (let i = 0; i < 280; i++) {
      const angle = (i / 280) * Math.PI * 2 * 3;
      const r = Math.random() * 80 + 10;
      const speed = Math.random() * 8 + 4;
      particlesRef.current.push({
        x: cx + Math.cos(angle) * r,
        y: cy + Math.sin(angle) * r,
        vx: -Math.sin(angle) * speed + (Math.random() - 0.5) * 2,
        vy: Math.cos(angle) * speed + (Math.random() - 0.5) * 2,
        age: 0,
        maxAge: Math.random() * 80 + 60,
        size: Math.random() * 4 + 2,
        color: currentColors[i % currentColors.length],
      });
    }
  };

  // 触发反重力粒子升腾
  const triggerAntiGravity = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const currentColors = PALETTES[paletteIndex].colors;

    for (let i = 0; i < 300; i++) {
      particlesRef.current.push({
        x: Math.random() * canvas.width,
        y: canvas.height - 10 - Math.random() * 40,
        vx: (Math.random() - 0.5) * 4,
        vy: -(Math.random() * 7 + 4),
        age: 0,
        maxAge: Math.random() * 100 + 70,
        size: Math.random() * 3.5 + 1.5,
        color: currentColors[i % currentColors.length],
      });
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      void containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      void document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // 物理模拟主动循环
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let animId = 0;
    let frameCount = 0;
    let lastFpsTime = performance.now();

    const resizeCanvas = () => {
      const container = containerRef.current;
      if (!container || !canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = container.clientWidth * dpr;
      canvas.height = container.clientHeight * dpr;
      ctx.scale(dpr, dpr);
      ctx.fillStyle = "#060913";
      ctx.fillRect(0, 0, container.clientWidth, container.clientHeight);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const loop = () => {
      animId = requestAnimationFrame(loop);
      const container = containerRef.current;
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;

      // 1. 半透明渐隐拖尾 (Fluid Trail Fade)
      ctx.fillStyle = "rgba(6, 9, 19, 0.14)";
      ctx.fillRect(0, 0, w, h);

      // 2. 指针移动时生成流体丝与粒子
      const p = pointerRef.current;
      const currentColors = PALETTES[paletteIndex].colors;
      const speed = Math.hypot(p.vx, p.vy);

      if (p.isDown || speed > 1) {
        const emitCount = p.isDown ? particleDensity * 2 : Math.min(particleDensity, Math.floor(speed * 0.8));
        for (let i = 0; i < emitCount; i++) {
          p.colorStep += 0.05;
          const colorIdx = Math.floor(p.colorStep) % currentColors.length;
          const spreadAngle = Math.random() * Math.PI * 2;
          const spreadSpeed = Math.random() * (speed * 0.4 + 2);

          particlesRef.current.push({
            x: p.x + (Math.random() - 0.5) * 16,
            y: p.y + (Math.random() - 0.5) * 16,
            vx: p.vx * 0.45 + Math.cos(spreadAngle) * spreadSpeed,
            vy: p.vy * 0.45 + Math.sin(spreadAngle) * spreadSpeed,
            age: 0,
            maxAge: Math.random() * 70 + 40,
            size: Math.random() * 4 + 1.5,
            color: currentColors[colorIdx],
          });
        }
      }

      // 指针速度自然阻尼衰减
      p.vx *= 0.88;
      p.vy *= 0.88;

      // 3. 逐粒子物理模拟与流体力场
      const particles = particlesRef.current;
      ctx.globalCompositeOperation = "lighter";

      for (let i = particles.length - 1; i >= 0; i--) {
        const pt = particles[i];
        pt.age++;

        if (pt.age >= pt.maxAge) {
          particles.splice(i, 1);
          continue;
        }

        // 简化的涡度速度场 (Vorticity curl)
        const curlX = Math.sin(pt.y * 0.015) * vorticityStrength;
        const curlY = Math.cos(pt.x * 0.015) * vorticityStrength;
        pt.vx = (pt.vx + curlX * 0.15) * viscosity;
        pt.vy = (pt.vy + curlY * 0.15) * viscosity;

        pt.x += pt.vx;
        pt.y += pt.vy;

        // 边界弹性反弹
        if (pt.x < 0) { pt.x = 0; pt.vx *= -0.7; }
        if (pt.x > w) { pt.x = w; pt.vx *= -0.7; }
        if (pt.y < 0) { pt.y = 0; pt.vy *= -0.7; }
        if (pt.y > h) { pt.y = h; pt.vy *= -0.7; }

        // 渲染发光流体粒子
        const lifeRatio = 1 - pt.age / pt.maxAge;
        const currentRadius = pt.size * lifeRatio;

        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, Math.max(0.5, currentRadius), 0, Math.PI * 2);
        ctx.fill();

        // 粒子连线 (当两粒子足够接近时产生丝状发光连接)
        if (i > 0 && i % 3 === 0) {
          const prevPt = particles[i - 1];
          const distSq = (pt.x - prevPt.x) ** 2 + (pt.y - prevPt.y) ** 2;
          if (distSq < 1600) {
            ctx.strokeStyle = pt.color;
            ctx.lineWidth = lifeRatio * 1.5;
            ctx.beginPath();
            ctx.moveTo(pt.x, pt.y);
            ctx.lineTo(prevPt.x, prevPt.y);
            ctx.stroke();
          }
        }
      }

      ctx.globalCompositeOperation = "source-over";

      // 4. 计算 FPS
      frameCount++;
      const now = performance.now();
      if (now - lastFpsTime >= 1000) {
        setFps(frameCount);
        setActiveParticles(particles.length);
        frameCount = 0;
        lastFpsTime = now;
      }
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [viscosity, particleDensity, vorticityStrength, paletteIndex]);

  // 事件监听：鼠标与多点触控
  const handlePointerDown = (e: React.PointerEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const p = pointerRef.current;
    p.isDown = true;
    p.x = e.clientX - rect.left;
    p.y = e.clientY - rect.top;
    p.prevX = p.x;
    p.prevY = p.y;
    p.vx = 0;
    p.vy = 0;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const p = pointerRef.current;
    const nx = e.clientX - rect.left;
    const ny = e.clientY - rect.top;
    p.vx = nx - p.prevX;
    p.vy = ny - p.prevY;
    p.prevX = nx;
    p.prevY = ny;
    p.x = nx;
    p.y = ny;
  };

  const handlePointerUp = () => {
    pointerRef.current.isDown = false;
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden select-none touch-none bg-[#060913] ${
        isFullscreen ? "fixed inset-0 z-50 h-screen" : "h-[calc(100vh-64px)] min-h-[640px] rounded-2xl border border-slate-800 shadow-2xl"
      }`}
    >
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className="w-full h-full cursor-crosshair"
      />

      {/* 顶部极客状态与控制栏 */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <Link
            href="/experiments"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700/60 text-slate-200 hover:text-white hover:border-cyan-500/50 text-xs font-medium shadow-lg transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>实验室门户</span>
          </Link>

          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md border border-cyan-500/30 text-cyan-400 text-xs font-mono shadow-lg">
            <Sparkles className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
            <span className="font-semibold text-slate-200">FLUID PHYS-LAB</span>
            <span className="text-slate-400">|</span>
            <span>{fps} FPS</span>
            <span className="text-slate-400">|</span>
            <span>{activeParticles.toLocaleString()} 粒子</span>
          </div>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          {/* 特效快捷按钮 */}
          <button
            type="button"
            onClick={triggerVortexBurst}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700/60 text-slate-200 hover:border-cyan-500/50 hover:text-cyan-300 text-xs shadow-lg transition-all cursor-pointer"
            title="激发中心旋涡能量爆发"
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">漩涡爆发</span>
          </button>

          <button
            type="button"
            onClick={triggerAntiGravity}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700/60 text-slate-200 hover:border-cyan-500/50 hover:text-cyan-300 text-xs shadow-lg transition-all cursor-pointer"
            title="反重力粒子升腾喷涌"
          >
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">反重力升腾</span>
          </button>

          <button
            type="button"
            onClick={clearCanvas}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700/60 text-slate-300 hover:text-white hover:border-cyan-500/50 shadow-lg transition-all cursor-pointer"
            title="清空画布"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700/60 text-slate-300 hover:text-white hover:border-cyan-500/50 shadow-lg transition-all cursor-pointer"
            title="全屏切换"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={() => setShowControls(!showControls)}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-cyan-500/20 backdrop-blur-md border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/30 shadow-lg transition-all cursor-pointer"
            title="参数调优面板"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 底部引导提示条 */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/85 backdrop-blur-md border border-slate-800 text-[11px] font-mono text-slate-400 shadow-xl">
          <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
          <span>在屏幕上长按并划动手指或鼠标即可激发流体波纹与丝绸光束</span>
        </div>
      </div>

      {/* 右侧流体物理控制浮层 */}
      {showControls && (
        <div className="absolute top-16 right-4 z-20 w-72 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 p-4 shadow-2xl text-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Droplets className="w-3.5 h-3.5 text-cyan-400" />
              流体力学调优
            </span>
            <span className="text-[10px] text-cyan-400 font-mono">NAVIER-STOKES</span>
          </div>

          {/* 预设配色方案 */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>着色光谱</span>
              <span className="text-cyan-400 font-mono">{PALETTES[paletteIndex].name}</span>
            </div>
            <div className="grid grid-cols-5 gap-1.5 pt-1">
              {PALETTES.map((pal, idx) => (
                <button
                  key={pal.name}
                  type="button"
                  onClick={() => setPaletteIndex(idx)}
                  className={`h-6 rounded-lg transition-all cursor-pointer border ${
                    paletteIndex === idx ? "border-white scale-105 shadow-md" : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                  style={{
                    background: `linear-gradient(135deg, ${pal.colors[0]}, ${pal.colors[1]})`,
                  }}
                  title={pal.name}
                />
              ))}
            </div>
          </div>

          {/* 粘度/阻尼 */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>流体粘度阻尼</span>
              <span className="font-mono text-cyan-400">{viscosity.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.90"
              max="0.99"
              step="0.01"
              value={viscosity}
              onChange={(e) => setViscosity(parseFloat(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
          </div>

          {/* 涡流扰动强度 */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>卷吸与涡流强度</span>
              <span className="font-mono text-cyan-400">{vorticityStrength.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="3.0"
              step="0.2"
              value={vorticityStrength}
              onChange={(e) => setVorticityStrength(parseFloat(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
          </div>

          {/* 粒子喷涌密度 */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>喷涌发射密度</span>
              <span className="font-mono text-cyan-400">{particleDensity}</span>
            </div>
            <input
              type="range"
              min="4"
              max="24"
              step="2"
              value={particleDensity}
              onChange={(e) => setParticleDensity(parseInt(e.target.value, 10))}
              className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
}
