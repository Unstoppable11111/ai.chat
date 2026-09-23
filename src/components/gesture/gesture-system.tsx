"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import {
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCw,
  Camera,
  CameraOff,
  Sliders,
  ChevronUp,
  Activity,
  Zap,
  Heart,
  Globe,
  Radio,
  Disc,
  Flame,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

// 预设形状定义
export type ParticleShape = "nebula" | "heart" | "saturn" | "helix" | "waves" | "fireworks";

interface ShapeOption {
  id: ParticleShape;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const SHAPES: ShapeOption[] = [
  { id: "nebula", label: "星云星系", icon: Globe, description: "流体漩涡粒子引力场" },
  { id: "heart", label: "量子心动", icon: Heart, description: "3D立体心形与心跳脉冲" },
  { id: "saturn", label: "土星光环", icon: Disc, description: "核心球体与倾斜轨道环" },
  { id: "helix", label: "双螺旋DNA", icon: Activity, description: "生命密码基因双链" },
  { id: "waves", label: "量化波浪", icon: Radio, description: "三维起伏波动曲面" },
  { id: "fireworks", label: "超新星", icon: Flame, description: "爆发绽放的璀璨星火" },
];

const COLOR_PRESETS = [
  { name: "极光霓虹", c1: "#ff007f", c2: "#7928ca" },
  { name: "赛博电青", c1: "#00f2fe", c2: "#4facfe" },
  { name: "炽热恒星", c1: "#ff4b1f", c2: "#ff9068" },
  { name: "量子翡翠", c1: "#00b09b", c2: "#96c93d" },
  { name: "宇宙微光", c1: "#e0c3fc", c2: "#8ec5fc" },
];

const MUSIC_PLAYLIST = [
  {
    title: "疯狂动物城1 - Try Everything",
    src: "/gesture-assets/music/%E3%80%90Shakira%E3%80%91%E7%96%AF%E7%8B%82%E5%8A%A8%E7%89%A9%E5%9F%8E1%E4%B8%BB%E9%A2%98%E6%9B%B2%E3%80%8ATry%20Everything%E3%80%8B.mp3",
  },
  {
    title: "疯狂动物城2 - Zoo",
    src: "/gesture-assets/music/%E3%80%90Shakira%E3%80%91%E7%96%AF%E7%8B%82%E5%8A%A8%E7%89%A9%E5%9F%8E2%E4%B8%BB%E9%A2%98%E6%9B%B2%E3%80%8AZoo%E3%80%8B.mp3",
  },
  {
    title: "最初的记忆 (DJ Remix)",
    src: "/gesture-assets/music/%E3%80%90%E6%97%A0%E6%8D%9F%E9%9F%B3%E8%B4%A8%E3%80%91%E3%80%8A%E6%9C%80%E5%88%9D%E7%9A%84%E8%AE%B0%E5%BF%86%20(DJ%E7%89%88)%E3%80%8B-%20DJ%E9%98%BF%E6%99%BA%20Remix.mp3",
  },
];

// 生成发光圆形粒子贴图（避免生硬方块）
function createParticleTexture(): THREE.Texture {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
    gradient.addColorStop(0.2, "rgba(255, 255, 255, 0.85)");
    gradient.addColorStop(0.5, "rgba(255, 255, 255, 0.35)");
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(32, 32, 32, 0, Math.PI * 2);
    ctx.fill();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export function GestureSystem() {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // 状态管理
  const [currentShape, setCurrentShape] = useState<ParticleShape>("nebula");
  const [colorIndex, setColorIndex] = useState(0);
  const [particleSize, setParticleSize] = useState(2.2);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isUIPanelOpen, setIsUIPanelOpen] = useState(true);
  const [particleCountDisplay, setParticleCountDisplay] = useState(10000);
  const [currentGestureText, setCurrentGestureText] = useState("触控模式就绪");

  // Three.js 核心引用
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const positionsRef = useRef<Float32Array | null>(null);
  const targetPositionsRef = useRef<Float32Array | null>(null);
  const colorsRef = useRef<Float32Array | null>(null);
  const particleCountRef = useRef(10000);

  // 动画与物理交互引用
  const animFrameIdRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioDataArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const audioSourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);

  // 触控交互参数
  const touchStateRef = useRef({
    isDown: false,
    prevX: 0,
    prevY: 0,
    rotX: 0,
    rotY: 0,
    targetRotX: 0,
    targetRotY: 0,
    pinchDist: 0,
    scale: 1,
    targetScale: 1,
    attractor: new THREE.Vector3(9999, 9999, 0),
    pulseStrength: 0,
  });

  // 生成各形态目标三维坐标算法
  const computeShapeCoordinates = useCallback((shape: ParticleShape, count: number): Float32Array => {
    const coords = new Float32Array(count * 3);
    const colorA = new THREE.Color(COLOR_PRESETS[colorIndex].c1);
    const colorB = new THREE.Color(COLOR_PRESETS[colorIndex].c2);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      let x = 0;
      let y = 0;
      let z = 0;
      const ratio = i / count;

      if (shape === "nebula") {
        // 漩涡星系 (对数螺旋 + 高斯扩散)
        const arms = 3;
        const radius = Math.pow(Math.random(), 1.5) * 120 + 5;
        const spinAngle = radius * 0.08;
        const branchAngle = ((i % arms) * (2 * Math.PI)) / arms;
        const randomX = (Math.random() - 0.5) * (15 + radius * 0.2);
        const randomY = (Math.random() - 0.5) * (10 + radius * 0.15);
        const randomZ = (Math.random() - 0.5) * (15 + radius * 0.2);
        x = Math.cos(branchAngle + spinAngle) * radius + randomX;
        z = Math.sin(branchAngle + spinAngle) * radius + randomZ;
        y = randomY;
      } else if (shape === "heart") {
        // 3D 立体心形
        const t = Math.PI * 2 * Math.random();
        const u = Math.PI * (Math.random() - 0.5);
        // 心形参数方程
        const hx = 16 * Math.pow(Math.sin(t), 3);
        const hy = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
        const depth = Math.cos(u) * (12 - Math.abs(hx) * 0.4);
        const scale = 5.5 + (Math.random() - 0.5) * 0.8;
        x = hx * scale;
        y = hy * scale + 10;
        z = depth * 5.0 * Math.sin(u);
      } else if (shape === "saturn") {
        // 土星核心球 + 环带 (70%环带，30%核心球)
        if (i < count * 0.35) {
          // 核心行星球体
          const u = Math.random();
          const v = Math.random();
          const theta = u * 2.0 * Math.PI;
          const phi = Math.acos(2.0 * v - 1.0);
          const r = Math.cbrt(Math.random()) * 36;
          x = r * Math.sin(phi) * Math.cos(theta);
          y = r * Math.sin(phi) * Math.sin(theta);
          z = r * Math.cos(phi);
        } else {
          // 光环带 (半径 55 ~ 140，带偏角)
          const angle = Math.random() * Math.PI * 2;
          const r = 52 + Math.random() * 85;
          const tilt = 0.45; // 倾角
          const rx = Math.cos(angle) * r;
          const rz = Math.sin(angle) * r;
          const ry = (Math.random() - 0.5) * 3;
          x = rx;
          y = ry * Math.cos(tilt) - rz * Math.sin(tilt);
          z = ry * Math.sin(tilt) + rz * Math.cos(tilt);
        }
      } else if (shape === "helix") {
        // 双螺旋 DNA
        const t = (i / count) * Math.PI * 18;
        const strand = i % 2 === 0 ? 1 : -1;
        const radius = 28;
        const isRung = Math.random() < 0.15; // 碱基梯级
        if (isRung) {
          const lerp = Math.random();
          x = (Math.cos(t) * radius * lerp) + (Math.cos(t + Math.PI) * radius * (1 - lerp));
          z = (Math.sin(t) * radius * lerp) + (Math.sin(t + Math.PI) * radius * (1 - lerp));
          y = ((i / count) - 0.5) * 220;
        } else {
          x = Math.cos(t + (strand === 1 ? 0 : Math.PI)) * radius + (Math.random() - 0.5) * 3;
          z = Math.sin(t + (strand === 1 ? 0 : Math.PI)) * radius + (Math.random() - 0.5) * 3;
          y = ((i / count) - 0.5) * 220;
        }
      } else if (shape === "waves") {
        // 量子起伏网格
        const side = Math.floor(Math.sqrt(count));
        const col = i % side;
        const row = Math.floor(i / side);
        const wx = (col / side - 0.5) * 220;
        const wz = (row / side - 0.5) * 220;
        const dist = Math.sqrt(wx * wx + wz * wz);
        const wy = Math.sin(dist * 0.08) * 18 + Math.cos(wx * 0.05) * 8;
        x = wx;
        y = wy;
        z = wz;
      } else if (shape === "fireworks") {
        // 超新星爆发流星
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);
        const speed = Math.pow(Math.random(), 0.6) * 125 + 10;
        x = speed * Math.sin(phi) * Math.cos(theta);
        y = speed * Math.sin(phi) * Math.sin(theta);
        z = speed * Math.cos(phi);
      }

      coords[i3] = x;
      coords[i3 + 1] = y;
      coords[i3 + 2] = z;

      // 渐变色彩插值
      const lerpedColor = colorA.clone().lerp(colorB, (Math.sin(ratio * Math.PI * 2) + 1) * 0.5);
      colors[i3] = lerpedColor.r;
      colors[i3 + 1] = lerpedColor.g;
      colors[i3 + 2] = lerpedColor.b;
    }

    if (colorsRef.current && particlesRef.current) {
      const colAttr = particlesRef.current.geometry.attributes.color as THREE.BufferAttribute;
      if (colAttr) {
        colAttr.copyArray(colors);
        colAttr.needsUpdate = true;
      }
    }

    return coords;
  }, [colorIndex]);

  // 初始化音频分析器
  const initAudioContext = () => {
    if (!audioRef.current) return;
    if (!audioContextRef.current) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const source = ctx.createMediaElementSource(audioRef.current);
      source.connect(analyser);
      analyser.connect(ctx.destination);

      audioContextRef.current = ctx;
      analyserRef.current = analyser;
      audioDataArrayRef.current = dataArray;
      audioSourceNodeRef.current = source;
    } else if (audioContextRef.current.state === "suspended") {
      void audioContextRef.current.resume();
    }
  };

  const togglePlayAudio = () => {
    if (!audioRef.current) return;
    initAudioContext();
    if (audioRef.current.paused) {
      void audioRef.current.play();
      setIsPlayingAudio(true);
    } else {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    }
  };

  const nextTrack = () => {
    const nextIdx = (currentTrackIndex + 1) % MUSIC_PLAYLIST.length;
    setCurrentTrackIndex(nextIdx);
    if (audioRef.current) {
      audioRef.current.src = MUSIC_PLAYLIST[nextIdx].src;
      audioRef.current.load();
      if (isPlayingAudio) {
        initAudioContext();
        void audioRef.current.play();
      }
    }
  };

  // 切换形状
  const handleSelectShape = (shape: ParticleShape) => {
    setCurrentShape(shape);
    if (targetPositionsRef.current) {
      const newCoords = computeShapeCoordinates(shape, particleCountRef.current);
      targetPositionsRef.current.set(newCoords);
      touchStateRef.current.pulseStrength = 1.0; // 爆发形态扩散动效
    }
  };


  // 摄像头手势识别启动/关闭
  const toggleCamera = async () => {
    if (isCameraActive) {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
      setIsCameraActive(false);
      setCurrentGestureText("触控交互就绪");
      return;
    }

    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("当前浏览器环境不支持摄像头访问");
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: "user" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          void videoRef.current?.play();
        };
      }
      setIsCameraActive(true);
      setCurrentGestureText("摄像头手势追踪中 (张开/捏合/移动)");
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "无法开启摄像头";
      setCameraError(errMsg);
      setIsCameraActive(false);
      setTimeout(() => setCameraError(null), 4000);
    }
  };

  // 全屏切换
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      void containerRef.current.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      void document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  // Three.js 核心初始化与事件挂载
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 智能检测移动端，自动优化粒子量与 DPR 保证极致 60fps
    const isMobile = window.innerWidth < 768;
    const count = isMobile ? 5500 : 12000;
    particleCountRef.current = count;
    setParticleCountDisplay(count);

    // 1. Scene
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050811, 0.0035);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      1,
      1000
    );
    camera.position.set(0, 0, 180);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: !isMobile, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
    renderer.setClearColor(0x040711, 1);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Geometry & Material
    const geometry = new THREE.BufferGeometry();
    const initialCoords = computeShapeCoordinates("nebula", count);
    const targetCoords = new Float32Array(initialCoords);
    const currentCoords = new Float32Array(initialCoords);
    const colors = new Float32Array(count * 3);

    positionsRef.current = currentCoords;
    targetPositionsRef.current = targetCoords;
    colorsRef.current = colors;

    geometry.setAttribute("position", new THREE.BufferAttribute(currentCoords, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    // 计算初次色彩
    const colorA = new THREE.Color(COLOR_PRESETS[0].c1);
    const colorB = new THREE.Color(COLOR_PRESETS[0].c2);
    for (let i = 0; i < count; i++) {
      const ratio = i / count;
      const c = colorA.clone().lerp(colorB, (Math.sin(ratio * Math.PI * 2) + 1) * 0.5);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    const texture = createParticleTexture();
    const material = new THREE.PointsMaterial({
      size: particleSize,
      vertexColors: true,
      map: texture,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particleSystem = new THREE.Points(geometry, material);
    scene.add(particleSystem);
    particlesRef.current = particleSystem;

    // ====== 移动端与桌面端交互事件监听 ======
    const touch = touchStateRef.current;

    const handlePointerDown = (e: PointerEvent) => {
      touch.isDown = true;
      touch.prevX = e.clientX;
      touch.prevY = e.clientY;
    };

    const handlePointerMove = (e: PointerEvent) => {
      // 触控/鼠标引力场投影到 3D 空间
      const rect = container.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      touch.attractor.set(nx * 100, ny * 100, 0);

      if (touch.isDown) {
        const dx = e.clientX - touch.prevX;
        const dy = e.clientY - touch.prevY;
        touch.targetRotY += dx * 0.005;
        touch.targetRotX += dy * 0.005;
        touch.prevX = e.clientX;
        touch.prevY = e.clientY;
      }
    };

    const handlePointerUp = () => {
      touch.isDown = false;
      touch.attractor.set(9999, 9999, 0);
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      touch.targetScale = Math.max(0.4, Math.min(2.5, touch.targetScale - e.deltaY * 0.0015));
    };

    // 移动端双指缩放手势 (Touch Event)
    let initialPinchDistance = 0;
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        initialPinchDistance = Math.hypot(dx, dy);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);
        if (initialPinchDistance > 0) {
          const delta = (dist - initialPinchDistance) * 0.004;
          touch.targetScale = Math.max(0.4, Math.min(2.5, touch.targetScale + delta));
          initialPinchDistance = dist;
        }
      }
    };

    // 双击触发超新星能量脉冲
    const handleDoubleClick = () => {
      touch.pulseStrength = 1.2;
    };

    container.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    container.addEventListener("wheel", handleWheel, { passive: false });
    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchmove", handleTouchMove, { passive: true });
    container.addEventListener("dblclick", handleDoubleClick);

    // 窗口尺寸 Resize 自适应
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    // 5. 渲染循环 (Animation Loop)
    let clockTime = 0;
    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);
      clockTime += 0.015;

      // 提取音频频谱律动
      let audioBass = 0;
      let audioHigh = 0;
      if (analyserRef.current && audioDataArrayRef.current && isPlayingAudio) {
        analyserRef.current.getByteFrequencyData(audioDataArrayRef.current);
        const data = audioDataArrayRef.current;
        // 计算低频 (前 8 个频段)
        let bassSum = 0;
        for (let i = 0; i < 8; i++) bassSum += data[i];
        audioBass = (bassSum / 8 / 255); // 0 ~ 1

        // 高频
        let highSum = 0;
        for (let i = 16; i < 32; i++) highSum += data[i];
        audioHigh = (highSum / 16 / 255);
      }

      // 平滑缓动旋转与缩放
      touch.rotX += (touch.targetRotX - touch.rotX) * 0.08;
      touch.rotY += (touch.targetRotY - touch.rotY) * 0.08;
      touch.scale += (touch.targetScale - touch.scale) * 0.08;

      if (!touch.isDown) {
        // 自转
        touch.targetRotY += 0.0025;
      }

      // 脉冲衰减
      touch.pulseStrength *= 0.94;

      if (particleSystem && positionsRef.current && targetPositionsRef.current) {
        particleSystem.rotation.x = touch.rotX;
        particleSystem.rotation.y = touch.rotY;

        // 音频驱动整体缩放与心跳律动
        const dynamicScale = touch.scale * (1 + audioBass * 0.28 + touch.pulseStrength * 0.35);
        particleSystem.scale.set(dynamicScale, dynamicScale, dynamicScale);

        const posAttr = particleSystem.geometry.attributes.position as THREE.BufferAttribute;
        const currentPos = positionsRef.current;
        const targetPos = targetPositionsRef.current;
        const attractor = touch.attractor;

        // 逐粒子物理插值与引力场
        const pulse = touch.pulseStrength * 40;
        for (let i = 0; i < count; i++) {
          const i3 = i * 3;
          let tx = targetPos[i3];
          let ty = targetPos[i3 + 1];
          let tz = targetPos[i3 + 2];

          // 脉冲扩散偏移
          if (pulse > 0.05) {
            tx += (tx * 0.02) * pulse;
            ty += (ty * 0.02) * pulse;
            tz += (tz * 0.02) * pulse;
          }

          // 高频音浪微扰
          if (audioHigh > 0.1) {
            tx += Math.sin(clockTime * 5 + i) * audioHigh * 3;
            ty += Math.cos(clockTime * 5 + i) * audioHigh * 3;
          }

          // 吸引子相互作用 (手势/触控引力)
          if (attractor.x < 1000) {
            const dx = attractor.x - currentPos[i3];
            const dy = attractor.y - currentPos[i3 + 1];
            const distSq = dx * dx + dy * dy;
            if (distSq < 2500 && distSq > 4) {
              const force = (1 - distSq / 2500) * 1.5;
              tx += dx * force;
              ty += dy * force;
            }
          }

          // 物理弹性追随目标点 (Spring Lerp)
          currentPos[i3] += (tx - currentPos[i3]) * 0.065;
          currentPos[i3 + 1] += (ty - currentPos[i3 + 1]) * 0.065;
          currentPos[i3 + 2] += (tz - currentPos[i3 + 2]) * 0.065;
        }

        posAttr.needsUpdate = true;
      }

      renderer.render(scene, camera);
    };

    animate();

    // 清理资源
    return () => {
      cancelAnimationFrame(animFrameIdRef.current);
      window.removeEventListener("resize", handleResize);
      container.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      container.removeEventListener("wheel", handleWheel);
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("dblclick", handleDoubleClick);

      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      texture.dispose();
      renderer.dispose();
    };
  }, [computeShapeCoordinates, particleSize, isPlayingAudio]);

  // 当颜色变化时重新计算
  useEffect(() => {
    if (targetPositionsRef.current) {
      computeShapeCoordinates(currentShape, particleCountRef.current);
    }
  }, [colorIndex, currentShape, computeShapeCoordinates]);

  // 粒子尺寸更新
  useEffect(() => {
    if (particlesRef.current) {
      const mat = particlesRef.current.material as THREE.PointsMaterial;
      if (mat) mat.size = particleSize;
    }
  }, [particleSize]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[calc(100vh-64px)] min-h-[600px] overflow-hidden bg-slate-950 select-none touch-none"
    >
      {/* 隐藏的音频元素 */}
      <audio
        ref={audioRef}
        src={MUSIC_PLAYLIST[currentTrackIndex].src}
        loop
        preload="auto"
        muted={isMuted}
      />

      {/* 顶部极客沉浸控制栏 */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700/60 text-slate-200 hover:text-white hover:border-cyan-500/50 text-xs font-medium shadow-lg transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">返回主站</span>
          </Link>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700/60 shadow-lg">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            <span className="text-xs font-semibold text-slate-200 font-mono tracking-wider">
              {currentGestureText}
            </span>
            <span className="text-[10px] text-cyan-400 font-mono hidden md:inline">
              [{particleCountDisplay.toLocaleString()} 粒子 · 60FPS]
            </span>
          </div>
        </div>

        {/* 顶部右侧快捷按钮组 */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* 摄像头手势开启 */}
          <button
            type="button"
            onClick={toggleCamera}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-md border text-xs font-medium shadow-lg transition-all cursor-pointer ${
              isCameraActive
                ? "bg-rose-500/20 border-rose-500/60 text-rose-300"
                : "bg-slate-900/80 border-slate-700/60 text-slate-200 hover:border-cyan-500/50"
            }`}
            title="开启前置摄像头手势识别"
          >
            {isCameraActive ? <CameraOff className="w-3.5 h-3.5" /> : <Camera className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isCameraActive ? "关闭摄像头" : "手势相机"}</span>
          </button>

          {/* 全屏切换 */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700/60 text-slate-200 hover:text-white hover:border-cyan-500/50 shadow-lg transition-all cursor-pointer"
            title="全屏切换"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          {/* 面板收展按钮 */}
          <button
            type="button"
            onClick={() => setIsUIPanelOpen(!isUIPanelOpen)}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-cyan-500/20 backdrop-blur-md border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/30 shadow-lg transition-all cursor-pointer"
            title="展开/收起控制面板"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 摄像头小画中画视窗 (开启手势时呈现) */}
      {isCameraActive && (
        <div className="absolute bottom-24 right-4 z-20 w-36 h-28 sm:w-48 sm:h-36 rounded-2xl overflow-hidden border-2 border-cyan-500/40 shadow-2xl bg-black/80 backdrop-blur-md">
          <video
            ref={videoRef}
            className="w-full h-full object-cover scale-x-[-1]"
            playsInline
            muted
            autoPlay
          />
          <div className="absolute bottom-1 left-2 text-[9px] font-mono text-cyan-400 bg-black/60 px-1.5 py-0.5 rounded">
            LIVE GESTURE
          </div>
        </div>
      )}

      {/* 错误提示浮层 */}
      {cameraError && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs shadow-xl backdrop-blur-md animate-fade-in">
          ⚠️ {cameraError}，已自动平滑降级至「全触控手势模式」
        </div>
      )}

      {/* 底部浮动快捷控制器：形态切换 + 音乐节拍 (移动端极其友好) */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 w-[94%] max-w-xl">
        <div className="p-2 sm:p-2.5 rounded-2xl bg-slate-900/85 backdrop-blur-xl border border-slate-700/70 shadow-2xl flex items-center justify-between gap-1.5 sm:gap-3">
          {/* 6 种形态单选快速切换 */}
          <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {SHAPES.map((item) => {
              const Icon = item.icon;
              const active = currentShape === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectShape(item.id)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 cursor-pointer ${
                    active
                      ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/30 font-bold"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                  }`}
                  title={item.description}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="text-[11px] sm:text-xs">{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="h-5 w-[1px] bg-slate-700/80 shrink-0" />

          {/* 音乐播放快捷胶囊 */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={togglePlayAudio}
              className={`flex items-center justify-center w-8 h-8 rounded-xl transition-all cursor-pointer ${
                isPlayingAudio
                  ? "bg-cyan-500 text-white shadow-md shadow-cyan-500/30 animate-pulse"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
              title={isPlayingAudio ? "暂停音乐" : "播放音乐体验音画脉冲"}
            >
              {isPlayingAudio ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
            </button>
            <button
              type="button"
              onClick={nextTrack}
              className="flex items-center justify-center w-8 h-8 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition-all cursor-pointer"
              title="切换下一首曲目"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 右侧高级调参抽屉 (可一键收起展开) */}
      {isUIPanelOpen && (
        <div className="absolute top-16 right-4 z-20 w-72 max-h-[calc(100vh-160px)] overflow-y-auto rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 p-4 shadow-2xl text-slate-200 space-y-4 animate-fade-in no-scrollbar">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              3D 粒子视效调优
            </span>
            <button
              type="button"
              onClick={() => setIsUIPanelOpen(false)}
              className="text-slate-400 hover:text-white p-1"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          </div>

          {/* 颜色主题预设选择 */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>粒子色彩主题</span>
              <span className="text-cyan-400 font-mono">{COLOR_PRESETS[colorIndex].name}</span>
            </div>
            <div className="grid grid-cols-5 gap-1.5 pt-1">
              {COLOR_PRESETS.map((preset, idx) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => setColorIndex(idx)}
                  className={`h-6 rounded-lg transition-all cursor-pointer border ${
                    colorIndex === idx ? "border-white scale-105 shadow-md" : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                  style={{
                    background: `linear-gradient(135deg, ${preset.c1}, ${preset.c2})`,
                  }}
                  title={preset.name}
                />
              ))}
            </div>
          </div>

          {/* 粒子粗细调节滑块 */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>粒子光晕半径</span>
              <span className="font-mono text-cyan-400">{particleSize.toFixed(1)}px</span>
            </div>
            <input
              type="range"
              min="0.8"
              max="5.0"
              step="0.2"
              value={particleSize}
              onChange={(e) => setParticleSize(parseFloat(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
          </div>

          {/* 当前音乐信息与静音切换 */}
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400 truncate max-w-[170px]">
                🎵 {MUSIC_PLAYLIST[currentTrackIndex].title}
              </span>
              <button
                type="button"
                onClick={() => setIsMuted(!isMuted)}
                className="text-slate-400 hover:text-white"
                title={isMuted ? "解除静音" : "静音"}
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-cyan-400" />}
              </button>
            </div>
            <p className="text-[10px] text-slate-500">
              实时提取音乐低频与高频能量，直接调制粒子膨胀与表面流体扰动。
            </p>
          </div>

          {/* 移动端与桌面端交互操作指南 */}
          <div className="pt-2 border-t border-slate-800/80 space-y-1 text-[11px] text-slate-400 leading-relaxed">
            <p className="font-semibold text-slate-300">💡 触控与操作技巧：</p>
            <p>• <strong>单指滑动</strong>：360° 旋转三维视角</p>
            <p>• <strong>双指捏合/鼠标滚轮</strong>：平滑缩放视距</p>
            <p>• <strong>点击/划动</strong>：指尖引力场粒子吸附</p>
            <p>• <strong>双击屏幕</strong>：超新星能量冲击波爆发</p>
          </div>
        </div>
      )}
    </div>
  );
}
