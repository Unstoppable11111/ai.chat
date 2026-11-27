"use client";

/**
 * Static, zero-repaint GPU pearl-aurora ambient canvas.
 * Replaces continuous full-screen CSS keyframe layers to eliminate idle/scroll compositor repaints.
 */
export function AnimatedBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-20 overflow-hidden bg-[#F8F8F8] transform-gpu"
    >
      {/* Ultra-soft cool slate ambient wash */}
      <div
        className="absolute -top-[18vh] -left-[10vw] h-[64vh] w-[62vw] rounded-full opacity-60"
        style={{
          background:
            "radial-gradient(closest-side, rgba(38, 56, 68, 0.045), rgba(216, 216, 228, 0.14) 55%, transparent 100%)",
        }}
      />
      {/* Top-right subtle silver haze */}
      <div
        className="absolute top-[8vh] -right-[12vw] h-[58vh] w-[54vw] rounded-full opacity-55"
        style={{
          background:
            "radial-gradient(closest-side, rgba(216, 216, 228, 0.32), rgba(242, 247, 249, 0.18) 55%, transparent 100%)",
        }}
      />
      {/* Lower-center crisp neutral mist */}
      <div
        className="absolute bottom-[-16vh] left-[22vw] h-[52vh] w-[56vw] rounded-full opacity-45"
        style={{
          background:
            "radial-gradient(closest-side, rgba(38, 56, 68, 0.03), transparent 100%)",
        }}
      />
      {/* Architectural dot-matrix texture */}
      <div
        className="absolute inset-0 opacity-35"
        style={{
          backgroundImage: "radial-gradient(rgba(200, 200, 200, 0.45) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
    </div>
  );
}
