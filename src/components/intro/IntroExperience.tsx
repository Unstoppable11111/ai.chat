"use client";

import React, { useEffect, useRef, useCallback } from "react";
import * as THREE from "three";
import { gsap } from "gsap";

/* ─────────────────────────────────────────────
   CONFIG
   ───────────────────────────────────────────── */
const DPR = Math.min(typeof window !== "undefined" ? window.devicePixelRatio : 1, 2);

/* ─────────────────────────────────────────────
   FULL-SCREEN QUAD VERTEX SHADER
   ───────────────────────────────────────────── */
const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

/* ─────────────────────────────────────────────
   MAIN COMPOSITE FRAGMENT SHADER
   All phases are rendered in a single shader
   driven by uniform progress values.
   ───────────────────────────────────────────── */
const FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv;

  uniform float uTime;
  uniform float uAspect;
  uniform vec2  uMouse;       // normalised mouse (-1..1)

  // Phase progress uniforms (0..1 each, driven by GSAP)
  uniform float uDarkness;    // 0→1 wood grain fades in
  uniform float uFriction;    // 0→1 friction intensifies
  uniform float uSpark;       // 0→1 spark flash
  uniform float uFire;        // 0→1 fire grows
  uniform float uDigital;     // 0→1 fire becomes digital
  uniform float uBurn;        // 0→1 screen burns away

  // ── noise helpers ──
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }

  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
    for (int i = 0; i < 5; i++) {
      v += a * noise(p);
      p = rot * p * 2.0;
      a *= 0.5;
    }
    return v;
  }

  // ── wood grain ──
  float woodGrain(vec2 uv) {
    float grain = fbm(uv * vec2(2.0, 8.0) + vec2(0.0, uTime * 0.02));
    return grain * 0.12;
  }

  // ── fire shape ──
  float fireShape(vec2 uv, float size) {
    // Centre at bottom-centre, flame goes up
    vec2 p = uv - vec2(0.5, 0.15);
    p.x *= uAspect;
    // Mouse influence (very subtle)
    p.x += uMouse.x * 0.03;

    float t = uTime;
    // Vertical speed
    p.y -= t * 0.4;
    // Horizontal turbulence
    p.x += sin(p.y * 4.0 + t * 2.0) * 0.08;
    p.x += sin(p.y * 8.0 + t * 3.0) * 0.04;

    float n = fbm(p * 3.5);
    // Distance from centre column
    float dist = abs((uv.x - 0.5) * uAspect);
    float width = size * 0.45;
    float shape = smoothstep(width, width * 0.1, dist);
    // Vertical taper
    float height = size * 0.9;
    float vShape = smoothstep(height, 0.0, uv.y - 0.15);
    // Combine
    float flame = shape * vShape * smoothstep(0.2, 0.6, n);
    return clamp(flame, 0.0, 1.0);
  }

  // ── digital effect over fire ──
  float digitalOverlay(vec2 uv, float progress) {
    float grid = step(0.97, fract(uv.x * 60.0)) + step(0.97, fract(uv.y * 60.0));
    float pulse = sin(uTime * 10.0 + uv.y * 40.0) * 0.5 + 0.5;
    float dots = step(0.92, hash(floor(uv * 30.0) + floor(uTime * 3.0)));
    return (grid * 0.3 + dots * 0.6) * pulse * progress;
  }

  // ── burn transition mask ──
  float burnMask(vec2 uv, float progress) {
    vec2 centre = vec2(0.5, 0.4);
    float dist = length((uv - centre) * vec2(uAspect, 1.0));
    float n = fbm(uv * 6.0 + uTime * 0.5) * 0.5;
    float threshold = progress * 1.8;
    return smoothstep(threshold, threshold - 0.15, dist + n * 0.4);
  }

  void main() {
    vec2 uv = vUv;
    vec3 col = vec3(0.0); // start black

    // ── PHASE 1: DARKNESS ──
    // Faint wood grain emerges
    float grain = woodGrain(uv) * uDarkness;
    // Only show in central rectangle area (like a wooden board)
    float boardMask = smoothstep(0.6, 0.45, abs(uv.x - 0.5))
                    * smoothstep(0.55, 0.4, abs(uv.y - 0.45));
    col += vec3(0.25, 0.18, 0.12) * grain * boardMask;

    // ── PHASE 2: FRICTION ──
    if (uFriction > 0.0) {
      // Friction glow at contact point
      vec2 contact = vec2(0.5, 0.35);
      float cDist = length((uv - contact) * vec2(uAspect, 1.0));
      float glow = exp(-cDist * 12.0) * uFriction;
      // Flickering
      glow *= 0.5 + 0.5 * sin(uTime * 20.0 + noise(uv * 10.0) * 6.28);
      col += vec3(1.0, 0.3, 0.05) * glow * 0.6;

      // Wood dust particles (shader-based)
      float dust = 0.0;
      for (int i = 0; i < 8; i++) {
        float fi = float(i);
        float angle = fi * 0.785 + uTime * (2.0 + fi * 0.3);
        float radius = 0.02 + uFriction * 0.06 * (0.5 + hash(vec2(fi, 0.0)));
        vec2 pp = contact + vec2(cos(angle), sin(angle)) * radius;
        float d = length((uv - pp) * vec2(uAspect, 1.0));
        dust += smoothstep(0.008, 0.002, d) * (0.5 + 0.5 * sin(uTime * 8.0 + fi));
      }
      col += vec3(0.9, 0.65, 0.3) * dust * uFriction * 0.5;
    }

    // ── PHASE 3: SPARK ──
    if (uSpark > 0.0) {
      vec2 sparkPos = vec2(0.5, 0.35);
      float sDist = length((uv - sparkPos) * vec2(uAspect, 1.0));
      // Bright core
      float sparkCore = exp(-sDist * 60.0) * uSpark;
      // Wider glow
      float sparkGlow = exp(-sDist * 8.0) * uSpark * 0.5;
      col += vec3(1.0, 0.95, 0.8) * sparkCore;
      col += vec3(1.0, 0.6, 0.2) * sparkGlow;

      // Flying sparks
      for (int i = 0; i < 12; i++) {
        float fi = float(i);
        float angle = hash(vec2(fi, 1.0)) * 6.28;
        float speed = 0.1 + hash(vec2(fi, 2.0)) * 0.2;
        float life = fract(uTime * speed + hash(vec2(fi, 3.0)));
        vec2 dir = vec2(cos(angle), sin(angle) * 0.5 + 0.5);
        vec2 pp = sparkPos + dir * life * 0.3 * uSpark;
        pp.y += life * 0.05; // rise
        float d = length((uv - pp) * vec2(uAspect, 1.0));
        float brightness = (1.0 - life) * uSpark;
        col += vec3(1.0, 0.7, 0.3) * smoothstep(0.005, 0.001, d) * brightness;
      }
    }

    // ── PHASE 4: FIRE ──
    if (uFire > 0.0) {
      float flame = fireShape(uv, uFire);
      // Fire colour gradient: white core → orange → dark red at edges
      vec3 fireCol = mix(vec3(0.15, 0.02, 0.0), vec3(1.0, 0.45, 0.05), flame);
      fireCol = mix(fireCol, vec3(1.0, 0.95, 0.8), smoothstep(0.6, 0.95, flame));
      col = mix(col, fireCol, flame);

      // Embers rising
      for (int i = 0; i < 15; i++) {
        float fi = float(i);
        float speed = 0.08 + hash(vec2(fi, 10.0)) * 0.12;
        float life = fract(uTime * speed + hash(vec2(fi, 11.0)));
        float x = 0.5 + (hash(vec2(fi, 12.0)) - 0.5) * 0.3 * uFire;
        x += sin(life * 6.28 + fi) * 0.02;
        float y = 0.15 + life * 0.7;
        vec2 pp = vec2(x, y);
        float d = length((uv - pp) * vec2(uAspect, 1.0));
        float brightness = (1.0 - life) * uFire * 0.7;
        col += vec3(1.0, 0.5, 0.1) * smoothstep(0.004, 0.001, d) * brightness;
      }
    }

    // ── PHASE 5: DIGITAL FIRE ──
    if (uDigital > 0.0) {
      float flame = fireShape(uv, 1.0); // fire stays full size
      float digi = digitalOverlay(uv, uDigital);
      // Shift fire colour toward cool white/blue
      vec3 digiCol = mix(vec3(1.0, 0.45, 0.05), vec3(0.85, 0.9, 1.0), uDigital * 0.7);
      col = mix(col, digiCol, flame * digi * 0.6);
      // Add pulsing digital particles
      col += vec3(0.7, 0.8, 1.0) * digi * flame * 0.3;
    }

    // ── PHASE 6: BURN ──
    if (uBurn > 0.0) {
      float mask = burnMask(uv, uBurn);
      // Edge fire glow
      float edge = smoothstep(0.02, 0.0, abs(mask - 0.5)) * 2.0;
      vec3 edgeCol = vec3(1.0, 0.5, 0.1) * edge;
      // Where mask is 1, we see through (transparent → homepage)
      // For prototype, show white/light behind the burn
      vec3 behind = vec3(0.95);
      col = mix(col, behind, mask);
      col += edgeCol * (1.0 - mask) * uBurn;
    }

    gl_FragColor = vec4(col, 1.0);
  }
`;

/* ─────────────────────────────────────────────
   INTRO TEXT OVERLAY (HTML, not WebGL)
   Cinematic text rendered as DOM for crisp fonts
   ───────────────────────────────────────────── */
interface TextOverlayState {
  firstSpark: boolean;
  nextFire: boolean;
}

/* ─────────────────────────────────────────────
   COMPONENT
   ───────────────────────────────────────────── */
export default function IntroExperience() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const frameRef = useRef<number>(0);
  const mouseRef = useRef({ x: 0, y: 0 });
  const uniformsRef = useRef({
    darkness: 0,
    friction: 0,
    spark: 0,
    fire: 0,
    digital: 0,
    burn: 0,
  });
  const [texts, setTexts] = React.useState<TextOverlayState>({
    firstSpark: false,
    nextFire: false,
  });
  const [phase, setPhase] = React.useState("darkness");
  const [showDebug, setShowDebug] = React.useState(false);
  const [complete, setComplete] = React.useState(false);
  const fpsRef = useRef({ frames: 0, last: 0, value: 60 });

  /* ── Setup Three.js ── */
  const setup = useCallback(() => {
    if (!containerRef.current) return;
    const w = window.innerWidth;
    const h = window.innerHeight;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false });
    renderer.setSize(w, h);
    renderer.setPixelRatio(DPR);
    renderer.setClearColor(0x000000);
    containerRef.current.appendChild(renderer.domElement);
    canvasRef.current = renderer.domElement;
    rendererRef.current = renderer;

    // Ortho scene with a single full-screen quad
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const geo = new THREE.PlaneGeometry(2, 2);
    const mat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        uTime: { value: 0 },
        uAspect: { value: w / h },
        uMouse: { value: new THREE.Vector2(0, 0) },
        uDarkness: { value: 0 },
        uFriction: { value: 0 },
        uSpark: { value: 0 },
        uFire: { value: 0 },
        uDigital: { value: 0 },
        uBurn: { value: 0 },
      },
      depthTest: false,
      depthWrite: false,
    });
    materialRef.current = mat;

    const mesh = new THREE.Mesh(geo, mat);
    scene.add(mesh);

    // Render loop
    const clock = new THREE.Clock();
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      mat.uniforms.uTime.value = t;
      mat.uniforms.uMouse.value.set(mouseRef.current.x, mouseRef.current.y);

      // Sync GSAP-driven values → uniforms
      const u = uniformsRef.current;
      mat.uniforms.uDarkness.value = u.darkness;
      mat.uniforms.uFriction.value = u.friction;
      mat.uniforms.uSpark.value = u.spark;
      mat.uniforms.uFire.value = u.fire;
      mat.uniforms.uDigital.value = u.digital;
      mat.uniforms.uBurn.value = u.burn;

      renderer.render(scene, camera);

      // FPS counter & debug stats
      fpsRef.current.frames++;
      const now = performance.now();
      if (now - fpsRef.current.last > 500) {
        fpsRef.current.value = Math.round(
          (fpsRef.current.frames * 1000) / (now - fpsRef.current.last)
        );
        fpsRef.current.frames = 0;
        fpsRef.current.last = now;
        const fpsEl = document.getElementById("fps-counter");
        if (fpsEl) fpsEl.textContent = String(fpsRef.current.value);

        // Update debug overlay metrics without re-rendering
        const updateMetric = (id: string, val: number) => {
          const el = document.getElementById(id);
          if (el) el.textContent = val.toFixed(2);
        };
        updateMetric("dbg-darkness", u.darkness);
        updateMetric("dbg-friction", u.friction);
        updateMetric("dbg-spark", u.spark);
        updateMetric("dbg-fire", u.fire);
        updateMetric("dbg-digital", u.digital);
        updateMetric("dbg-burn", u.burn);
      }
    };
    animate();

    // Resize
    const onResize = () => {
      const w2 = window.innerWidth;
      const h2 = window.innerHeight;
      renderer.setSize(w2, h2);
      mat.uniforms.uAspect.value = w2 / h2;
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      geo.dispose();
      mat.dispose();
      if (containerRef.current && renderer.domElement.parentNode === containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  /* ── Build GSAP Timeline ── */
  const buildTimeline = useCallback(() => {
    const u = uniformsRef.current;
    // Reset all values
    u.darkness = 0;
    u.friction = 0;
    u.spark = 0;
    u.fire = 0;
    u.digital = 0;
    u.burn = 0;

    const tl = gsap.timeline();

    // DARKNESS 0→1s
    tl.to(u, {
      darkness: 1,
      duration: 1.0,
      ease: "power2.inOut",
      onStart: () => setPhase("darkness"),
    });

    // FRICTION 1→3s
    tl.to(u, {
      friction: 1,
      duration: 2.0,
      ease: "power2.in",
      onStart: () => setPhase("friction"),
    });

    // SPARK 3→4s
    tl.to(u, {
      spark: 1,
      duration: 0.15,
      ease: "power4.out",
      onStart: () => {
        setPhase("spark");
        setTexts((prev) => ({ ...prev, firstSpark: true }));
      },
    });
    tl.to(u, {
      spark: 0,
      duration: 0.85,
      ease: "power2.out",
      onComplete: () => setTexts((prev) => ({ ...prev, firstSpark: false })),
    });

    // FIRE 4→6s
    tl.to(u, {
      fire: 1,
      duration: 2.0,
      ease: "power1.inOut",
      onStart: () => setPhase("fire"),
    });

    // DIGITAL FIRE 6→7.5s
    tl.to(u, {
      digital: 1,
      duration: 1.5,
      ease: "power2.inOut",
      onStart: () => {
        setPhase("intelligence");
        setTexts((prev) => ({ ...prev, nextFire: true }));
      },
      onComplete: () => setTexts((prev) => ({ ...prev, nextFire: false })),
    });

    // BURN 7.5→9.5s
    tl.to(u, {
      burn: 1,
      duration: 2.0,
      ease: "power2.inOut",
      onStart: () => setPhase("burn"),
    });

    // COMPLETE
    tl.add(() => {
      setPhase("complete");
      setComplete(true);
    });

    timelineRef.current = tl;
    return tl;
  }, []);

  /* ── Lifecycle ── */
  useEffect(() => {
    const cleanup = setup();
    const tl = buildTimeline();

    // Mouse
    const onMouse = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("mousemove", onMouse);

    // Debug toggle
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "d") setShowDebug((p) => !p);
    };
    window.addEventListener("keydown", onKey);

    // Expose replay
    (window as unknown as { replayIntro?: () => void }).replayIntro = () => {
      tl.restart();
      setComplete(false);
    };

    return () => {
      cleanup?.();
      tl.kill();
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Replay handler ── */
  const handleReplay = () => {
    if (timelineRef.current) {
      timelineRef.current.restart();
      setComplete(false);
    }
  };

  /* ── Skip handler ── */
  const handleSkip = () => {
    if (timelineRef.current) {
      // Jump to burn phase
      timelineRef.current.progress(0.85);
    }
  };

  return (
    <>
      {/* WebGL Canvas Container */}
      <div ref={containerRef} className="fixed inset-0 w-full h-full" />

      {/* Cinematic text: THE FIRST SPARK */}
      {texts.firstSpark && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-10">
          <h1
            className="text-white text-5xl md:text-7xl font-extralight tracking-[0.3em] uppercase opacity-0 animate-fade-in-out"
            style={{
              fontFamily: "var(--font-geist-sans)",
              animation: "introTextFade 1s ease-in-out forwards",
            }}
          >
            THE FIRST SPARK
          </h1>
        </div>
      )}

      {/* Cinematic text: THE NEXT FIRE */}
      {texts.nextFire && (
        <div className="fixed inset-0 flex flex-col items-center justify-center pointer-events-none z-10 gap-2">
          <h1
            className="text-white text-4xl md:text-6xl font-extralight tracking-[0.25em] uppercase"
            style={{
              fontFamily: "var(--font-geist-sans)",
              animation: "introTextFade 1.5s ease-in-out forwards",
            }}
          >
            THE NEXT FIRE
          </h1>
          <p
            className="text-white/60 text-lg md:text-2xl font-extralight tracking-[0.15em] uppercase"
            style={{
              fontFamily: "var(--font-geist-sans)",
              animation: "introTextFade 1.5s ease-in-out 0.3s forwards",
              opacity: 0,
            }}
          >
            CHANGES INTELLIGENCE.
          </p>
        </div>
      )}

      {/* Completion placeholder */}
      {complete && (
        <div className="fixed inset-0 flex items-center justify-center z-20 bg-white/95">
          <h1
            className="text-4xl md:text-6xl font-extralight tracking-[0.2em] text-neutral-900"
            style={{ fontFamily: "var(--font-geist-sans)" }}
          >
            THE NEXT WORLD
          </h1>
        </div>
      )}

      {/* Skip button */}
      {!complete && (
        <button
          onClick={handleSkip}
          className="fixed bottom-6 right-6 z-30 text-white/30 hover:text-white/60 text-sm tracking-[0.2em] uppercase transition-colors duration-300"
          style={{ fontFamily: "var(--font-geist-mono)" }}
        >
          SKIP →
        </button>
      )}

      {/* Replay button */}
      <button
        onClick={handleReplay}
        className="fixed top-4 right-4 z-30 text-white/40 hover:text-white/70 text-xs tracking-[0.15em] uppercase transition-colors duration-300"
        style={{ fontFamily: "var(--font-geist-mono)" }}
      >
        REPLAY
      </button>

      {/* Debug overlay */}
      {showDebug && (
        <div className="fixed bottom-4 left-4 z-30 bg-black/70 text-green-400 p-3 rounded font-mono text-xs space-y-1">
          <div>
            FPS: <span id="fps-counter">–</span>
          </div>
          <div>PHASE: {phase}</div>
          <div>DARKNESS: <span id="dbg-darkness">0.00</span></div>
          <div>FRICTION: <span id="dbg-friction">0.00</span></div>
          <div>SPARK: <span id="dbg-spark">0.00</span></div>
          <div>FIRE: <span id="dbg-fire">0.00</span></div>
          <div>DIGITAL: <span id="dbg-digital">0.00</span></div>
          <div>BURN: <span id="dbg-burn">0.00</span></div>
        </div>
      )}

      {/* CSS animation for text */}
      <style jsx global>{`
        @keyframes introTextFade {
          0% { opacity: 0; transform: translateY(10px); }
          20% { opacity: 1; transform: translateY(0); }
          80% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-10px); }
        }
      `}</style>
    </>
  );
}
