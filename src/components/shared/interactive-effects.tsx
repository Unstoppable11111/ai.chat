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

    const updateCursor = (event: PointerEvent) => {
      if (!readyRef.current) {
        readyRef.current = true;
        setReady(true);
      }
      
      // 放弃所有 JS 的弹簧差值计算（这会产生粘滞感），直接贴合硬件物理坐标
      if (markRef.current) {
        markRef.current.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0) translate(-50%, -50%)`;
      }
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
