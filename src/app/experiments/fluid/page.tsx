import type { Metadata } from "next";
import { PageShell } from "@/components/shared/page-shell";
import { PageIntro } from "@/components/shared/page-intro";
import { SectionHeading } from "@/components/shared/section-heading";
import { FluidLab } from "@/components/experiments/fluid-lab";
import { Droplets, Sparkles, Zap, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "霓虹流体与粒子动力学实验室 · Creative Fluid Lab",
  description:
    "基于 Navier-Stokes 简化流体力学与粒子动力学方程的高性能 WebGL/Canvas 模拟实验室。支持触屏丝绸拖尾、涡流激发与多重霓虹配色。",
  alternates: { canonical: "/experiments/fluid" },
};

export default function FluidExperimentPage() {
  return (
    <PageShell>
      <PageIntro>
        {/* 顶部情报标签 */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-medium">
              <Droplets className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>NAVIER-STOKES // 2D FLUID PARTICLE DYNAMICS</span>
            </div>

            <div className="hidden sm:flex items-center gap-4 text-xs font-mono text-slate-400 border border-white/10 rounded-full px-3.5 py-1 bg-[#060a14]/80 backdrop-blur-xs">
              <span className="flex items-center gap-1.5 text-white font-semibold">
                <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                <span>60 FPS 硬件加速</span>
              </span>
              <span className="text-white/15">|</span>
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                <span>零外网请求 · 纯本地运算</span>
              </span>
              <span className="text-white/15">|</span>
              <span className="flex items-center gap-1.5 text-purple-400 font-semibold">
                <Zap className="h-3.5 w-3.5 text-purple-400" />
                <span>全触屏多指支持</span>
              </span>
            </div>
          </div>

          <SectionHeading
            level={1}
            eyebrow="物理互动实验 · CREATIVE LAB"
            title="霓虹流体与物理粒子实验室"
            description="基于流体涡流与力场扩散模型的高性能物理画布。手指或鼠标划过屏幕即可激发丝滑流动的彩色霓虹光带与能量旋涡，支持实时调节粘度阻尼、涡度与喷涌密度。"
          />
        </div>

        {/* 核心画布容器 */}
        <div className="mt-6">
          <FluidLab />
        </div>
      </PageIntro>
    </PageShell>
  );
}
