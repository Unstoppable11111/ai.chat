export function AnimatedBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 hidden overflow-hidden md:block"
    >
      {/* 极光流动层 1：Cyber Cyan & Sky Blue 呼吸漫游 */}
      <div className="animate-aurora-1 absolute -top-[18%] -left-[12%] h-[72vh] w-[68vw] rounded-full bg-[radial-gradient(closest-side,rgba(0,240,255,0.12),rgba(56,189,248,0.04)_55%,transparent)]" />
      {/* 极光流动层 2：Neon Violet & Deep Indigo 对角漫游 */}
      <div className="animate-aurora-2 absolute top-[12%] -right-[14%] h-[68vh] w-[62vw] rounded-full bg-[radial-gradient(closest-side,rgba(168,85,247,0.11),rgba(129,140,248,0.035)_55%,transparent)]" />
      {/* 底部环境全息微光层 */}
      <div className="animate-aurora-1 absolute -bottom-[20%] left-[22%] h-[60vh] w-[58vw] rounded-full bg-[radial-gradient(closest-side,rgba(16,185,129,0.08),transparent_70%)]" />
      {/* 精密星际坐标微网格层 */}
      <div
        className="absolute inset-0 bg-grid opacity-[0.45]"
        style={{
          maskImage:
            "radial-gradient(ellipse 80% 70% at 50% 35%, black 20%, transparent 88%)",
        }}
      />
      {/* 深空星云纵深遮罩 */}
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(4,7,17,0.1),rgba(4,7,17,0.6)_50%,rgba(4,7,17,0.95))]" />
    </div>
  );
}
