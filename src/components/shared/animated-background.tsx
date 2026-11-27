"use client";

/**
 * Static, zero-repaint GPU pearl-aurora ambient canvas.
 * Replaces continuous full-screen CSS keyframe layers to eliminate idle/scroll compositor repaints.
 */
export function AnimatedBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-20 overflow-hidden bg-[#F8F8F4] transform-gpu"
    >
      {/* Top-left atmospheric botanical mist */}
      <div
        className="absolute -top-[18vh] -left-[10vw] h-[64vh] w-[62vw] rounded-full opacity-75"
        style={{
          background:
            "radial-gradient(closest-side, rgba(224, 231, 217, 0.65), rgba(24, 65, 32, 0.04) 55%, transparent 100%)",
        }}
      />
      {/* Top-right subtle cool slate haze */}
      <div
        className="absolute top-[8vh] -right-[12vw] h-[58vh] w-[54vw] rounded-full opacity-70"
        style={{
          background:
            "radial-gradient(closest-side, rgba(242, 247, 249, 0.9), rgba(38, 56, 68, 0.055) 55%, transparent 100%)",
        }}
      />
      {/* Lower-center warm ivory wash */}
      <div
        className="absolute bottom-[-16vh] left-[22vw] h-[52vh] w-[56vw] rounded-full opacity-65"
        style={{
          background:
            "radial-gradient(closest-side, rgba(255, 255, 242, 0.75), rgba(224, 231, 217, 0.25) 60%, transparent 100%)",
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
