export function AnimatedBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 hidden overflow-hidden md:block"
    >
      {/* 极光流动层 1：Cyan & Violet 呼吸漫游（纯 GPU translate3d 合成，零滤镜重绘开销） */}
      <div className="animate-aurora-1 absolute -top-[18%] -left-[12%] h-[68vh] w-[62vw] rounded-full bg-[radial-gradient(closest-side,rgba(14,165,233,0.075),rgba(56,189,248,0.025)_55%,transparent)]" />
      {/* 极光流动层 2：Violet & Indigo 对角漫游 */}
      <div className="animate-aurora-2 absolute top-[12%] -right-[14%] h-[64vh] w-[58vw] rounded-full bg-[radial-gradient(closest-side,rgba(139,92,246,0.06),rgba(99,102,241,0.02)_55%,transparent)]" />
      {/* 底部环境微光层 */}
      <div className="animate-aurora-1 absolute -bottom-[20%] left-[22%] h-[56vh] w-[54vw] rounded-full bg-[radial-gradient(closest-side,rgba(16,185,129,0.045),transparent_70%)]" />
      {/* 精密工程坐标微网格层 */}
      <div
        className="absolute inset-0 bg-grid opacity-[0.38]"
        style={{
          maskImage:
            "radial-gradient(ellipse 80% 70% at 50% 35%, black 15%, transparent 85%)",
        }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(245,247,251,0.0),rgba(245,247,251,0.05)_52%,rgba(245,247,251,0.0))]" />
    </div>
  );
}
