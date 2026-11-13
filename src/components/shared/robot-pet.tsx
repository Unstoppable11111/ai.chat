"use client";

import { motion, useReducedMotion } from "motion/react";

/**
 * 桌宠小机器人（纯 SVG + motion，无额外依赖）
 * - 身体轻微悬浮晃动；眼睛周期性眨眼；天线光点呼吸闪烁
 * - waving=true（有新回复 / 主动搭话）时右手挥动
 * - hovered 由父级 group-hover 控制头部点头，这里只负责自身循环动画
 */
export function RobotPet({
  waving = false,
  size = 56,
  className,
}: {
  waving?: boolean;
  size?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const loop = (duration: number, extra: Record<string, unknown> = {}) =>
    reduce ? undefined : { duration, repeat: Infinity, ease: "easeInOut" as const, ...extra };

  return (
    <motion.svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      animate={reduce ? undefined : { y: [0, -4, 0], rotate: [-2, 2, -2] }}
      transition={loop(3.2)}
      style={{ overflow: "visible" }}
    >
      <defs>
        <linearGradient id="pet-head" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#dbeafe" />
        </linearGradient>
        <linearGradient id="pet-body" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
        <linearGradient id="pet-face" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#1e293b" />
        </linearGradient>
      </defs>

      {/* 天线 */}
      <line x1="32" y1="9" x2="32" y2="15" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
      <motion.circle
        cx="32"
        cy="7"
        r="3"
        fill="#f472b6"
        animate={reduce ? undefined : { opacity: [1, 0.35, 1], scale: [1, 1.25, 1] }}
        transition={loop(1.8)}
        style={{ transformOrigin: "32px 7px" }}
      />

      {/* 身体（小圆润躯干） */}
      <rect x="20" y="44" width="24" height="14" rx="8" fill="url(#pet-body)" />
      <circle cx="32" cy="51" r="2.2" fill="#e0f2fe" opacity="0.9" />

      {/* 左手（静止） */}
      <ellipse cx="17" cy="50" rx="3.4" ry="5" fill="#7dd3fc" transform="rotate(18 17 50)" />

      {/* 右手（挥手） */}
      <motion.ellipse
        cx="47"
        cy="50"
        rx="3.4"
        ry="5"
        fill="#7dd3fc"
        animate={waving && !reduce ? { rotate: [10, -55, 10, -55, 10] } : { rotate: -18 }}
        transition={waving ? { duration: 1.1, repeat: Infinity, repeatDelay: 0.6 } : { duration: 0.3 }}
        style={{ transformOrigin: "47px 46px" }}
      />

      {/* 头部：侧耳 + 圆润头壳 */}
      <rect x="6" y="24" width="6" height="12" rx="3" fill="#93c5fd" />
      <rect x="52" y="24" width="6" height="12" rx="3" fill="#93c5fd" />
      <rect x="9" y="13" width="46" height="36" rx="17" fill="url(#pet-head)" stroke="#bfdbfe" strokeWidth="1.5" />

      {/* 屏幕脸 */}
      <rect x="14" y="19" width="36" height="24" rx="12" fill="url(#pet-face)" />

      {/* 眼睛（周期性眨眼） */}
      <motion.ellipse
        cx="24.5"
        cy="30"
        rx="3.2"
        ry="4"
        fill="#67e8f9"
        animate={reduce ? undefined : { scaleY: [1, 1, 0.1, 1, 1] }}
        transition={loop(4.2, { times: [0, 0.45, 0.5, 0.55, 1] })}
        style={{ transformOrigin: "24.5px 30px" }}
      />
      <motion.ellipse
        cx="39.5"
        cy="30"
        rx="3.2"
        ry="4"
        fill="#67e8f9"
        animate={reduce ? undefined : { scaleY: [1, 1, 0.1, 1, 1] }}
        transition={loop(4.2, { times: [0, 0.45, 0.5, 0.55, 1] })}
        style={{ transformOrigin: "39.5px 30px" }}
      />

      {/* 腮红与微笑 */}
      <circle cx="19.5" cy="36" r="2" fill="#f9a8d4" opacity="0.65" />
      <circle cx="44.5" cy="36" r="2" fill="#f9a8d4" opacity="0.65" />
      <path d="M28 36.5 Q32 40 36 36.5" stroke="#67e8f9" strokeWidth="2" fill="none" strokeLinecap="round" />
    </motion.svg>
  );
}
