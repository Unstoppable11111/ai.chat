"use client";

import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useSpring } from "motion/react";

const particles = Array.from({ length: 18 }, (_, index) => {
  const colors = [
    "rgba(14, 165, 233, 0.62)",
    "rgba(139, 92, 246, 0.52)",
    "rgba(101, 163, 13, 0.42)",
  ];

  return {
    id: index,
    x: `${(index * 37) % 100}%`,
    y: `${(index * 61) % 100}%`,
    size: `${4 + (index % 5)}px`,
    duration: `${6 + (index % 7)}s`,
    delay: `${(index % 8) * -0.7}s`,
    color: colors[index % colors.length],
  };
});

export function InteractiveEffects() {
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const [hovering, setHovering] = useState(false);
  const [ready, setReady] = useState(false);
  const markRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);
  const readyRef = useRef(false);
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 26,
    restDelta: 0.001,
  });

  useEffect(() => {
    if (reduceMotion || window.matchMedia("(pointer: coarse)").matches) return;

    document.documentElement.classList.add("has-custom-cursor");
    let frame = 0;
    let pointerX = window.innerWidth / 2;
    let pointerY = window.innerHeight / 2;
    let ringX = pointerX;
    let ringY = pointerY;

    const renderCursor = () => {
      ringX += (pointerX - ringX) * 0.24;
      ringY += (pointerY - ringY) * 0.24;
      markRef.current?.style.setProperty(
        "transform",
        `translate3d(${pointerX}px, ${pointerY}px, 0) translate(-50%, -50%)`,
      );
      ringRef.current?.style.setProperty(
        "transform",
        `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`,
      );
      frame = window.requestAnimationFrame(renderCursor);
    };

    const updateCursor = (event: PointerEvent) => {
      if (!readyRef.current) {
        readyRef.current = true;
        setReady(true);
        frame = window.requestAnimationFrame(renderCursor);
      }
      pointerX = event.clientX;
      pointerY = event.clientY;
    };

    const updateHoverState = (event: Event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      setHovering(
        Boolean(target.closest("a, button, [role='button'], input, textarea, select, summary")),
      );
    };

    window.addEventListener("pointermove", updateCursor, { passive: true });
    window.addEventListener("pointerover", updateHoverState, { passive: true });

    return () => {
      document.documentElement.classList.remove("has-custom-cursor");
      window.removeEventListener("pointermove", updateCursor);
      window.removeEventListener("pointerover", updateHoverState);
      window.cancelAnimationFrame(frame);
    };
  }, [reduceMotion]);

  return (
    <>
      <motion.div className="scroll-progress" style={{ scaleX }} />
      {!reduceMotion ? (
        <>
          <div
            ref={markRef}
            className={`cursor-mark${ready ? " is-ready" : ""}${hovering ? " is-hovering" : ""}`}
            aria-hidden="true"
          />
          <div
            ref={ringRef}
            className={`cursor-ring${ready ? " is-ready" : ""}${hovering ? " is-hovering" : ""}`}
            aria-hidden="true"
          />
          <div className="particle-field" aria-hidden="true">
            {particles.map((particle) => (
              <span
                key={particle.id}
                style={
                  {
                    "--x": particle.x,
                    "--y": particle.y,
                    "--size": particle.size,
                    "--duration": particle.duration,
                    "--delay": particle.delay,
                    "--color": particle.color,
                  } as CSSProperties
                }
              />
            ))}
          </div>
        </>
      ) : null}
    </>
  );
}
