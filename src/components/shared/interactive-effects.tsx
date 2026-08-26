"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useSpring } from "motion/react";

export function InteractiveEffects() {
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const [hovering, setHovering] = useState(false);
  const [ready, setReady] = useState(false);
  const [finePointer, setFinePointer] = useState(false);
  const markRef = useRef<HTMLDivElement | null>(null);
  const readyRef = useRef(false);
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 26,
    restDelta: 0.001,
  });

  useEffect(() => {
    const pointerQuery = window.matchMedia("(pointer: fine)");
    const updatePointer = () => setFinePointer(pointerQuery.matches);

    updatePointer();
    pointerQuery.addEventListener("change", updatePointer);

    return () => {
      pointerQuery.removeEventListener("change", updatePointer);
    };
  }, []);

  useEffect(() => {
    if (reduceMotion || !finePointer) return;

    document.documentElement.classList.add("has-custom-cursor");
    let frame = 0;
    let pointerX = window.innerWidth / 2;
    let pointerY = window.innerHeight / 2;
    // 使用插值坐标让唯一的光标带一点弹性延迟，更显高级
    let markX = pointerX;
    let markY = pointerY;

    const renderCursor = () => {
      markX += (pointerX - markX) * 0.35;
      markY += (pointerY - markY) * 0.35;
      markRef.current?.style.setProperty(
        "transform",
        `translate3d(${markX}px, ${markY}px, 0) translate(-50%, -50%)`,
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
  }, [finePointer, reduceMotion]);

  return (
    <>
      <motion.div className="scroll-progress" style={{ scaleX }} />
      {!reduceMotion && finePointer ? (
        <div
          ref={markRef}
          className={`cursor-mark${ready ? " is-ready" : ""}${hovering ? " is-hovering" : ""}`}
          aria-hidden="true"
        />
      ) : null}
    </>
  );
}
