"use client";

/**
 * Static, zero-repaint GPU pearl-aurora ambient canvas.
 * Replaces continuous full-screen CSS keyframe layers to eliminate idle/scroll compositor repaints.
 */
export function AnimatedBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-20 overflow-hidden bg-[#f4f7fb] transform-gpu"
    >
      {/* Top sky-cyan luminous pool */}
      <div
        className="absolute -top-[18vh] -left-[10vw] h-[64vh] w-[62vw] rounded-full opacity-55"
        style={{
          background:
            "radial-gradient(closest-side, rgba(14, 165, 233, 0.14), rgba(56, 189, 248, 0.05) 55%, transparent 100%)",
        }}
      />
      {/* Top-right royal-violet ambient glow */}
      <div
        className="absolute top-[8vh] -right-[12vw] h-[58vh] w-[54vw] rounded-full opacity-50"
        style={{
          background:
            "radial-gradient(closest-side, rgba(139, 92, 246, 0.12), rgba(167, 139, 250, 0.04) 55%, transparent 100%)",
        }}
      />
      {/* Lower-center subtle emerald aura */}
      <div
        className="absolute bottom-[-16vh] left-[22vw] h-[52vh] w-[56vw] rounded-full opacity-40"
        style={{
          background:
            "radial-gradient(closest-side, rgba(16, 185, 129, 0.09), rgba(52, 211, 153, 0.03) 55%, transparent 100%)",
        }}
      />
      {/* Crisp architectural dot-matrix texture */}
      <div
        className="absolute inset-0 opacity-45"
        style={{
          backgroundImage: "radial-gradient(rgba(148, 163, 184, 0.28) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
    </div>
  );
}
