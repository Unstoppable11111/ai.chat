"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useSpring } from "motion/react";

export function InteractiveEffects() {
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
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
      // 性能优化：直接切换 DOM class，避免每次 pointerover 都触发 React 重渲染
      markRef.current?.classList.toggle(
        "is-hovering",
        Boolean(target.closest("a, button, [role='button'], input, textarea, select, summary")),
      );
    };

    const handlePointerDown = () => {
      markRef.current?.classList.add("is-pressing");
    };

    const handlePointerUp = () => {
      markRef.current?.classList.remove("is-pressing");
    };

    window.addEventListener("pointermove", updateCursor, { passive: true });
    window.addEventListener("pointerover", updateHoverState, { passive: true });
    window.addEventListener("pointerdown", handlePointerDown, { passive: true });
    window.addEventListener("pointerup", handlePointerUp, { passive: true });

    return () => {
      document.documentElement.classList.remove("has-custom-cursor");
      window.removeEventListener("pointermove", updateCursor);
      window.removeEventListener("pointerover", updateHoverState);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [finePointer, reduceMotion]);

  return (
    <>
      <motion.div className="scroll-progress" style={{ scaleX }} />
      {!reduceMotion && finePointer ? (
        <div
          ref={markRef}
          className={`cursor-mark${ready ? " is-ready" : ""}`}
          aria-hidden="true"
        >
          <div className="cursor-dot" />
          <div className="cursor-ring" />
        </div>
      ) : null}
    </>
  );
}
