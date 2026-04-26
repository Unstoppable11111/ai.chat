export function AnimatedBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      <div className="absolute inset-[-16%] bg-[radial-gradient(ellipse_at_18%_18%,rgba(14,165,233,0.055),transparent_38%),radial-gradient(ellipse_at_84%_18%,rgba(139,92,246,0.04),transparent_40%),radial-gradient(ellipse_at_28%_84%,rgba(101,163,13,0.035),transparent_42%)] blur-3xl" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(245,247,251,0.0),rgba(245,247,251,0.04)_52%,rgba(245,247,251,0.0))]" />
    </div>
  );
}
