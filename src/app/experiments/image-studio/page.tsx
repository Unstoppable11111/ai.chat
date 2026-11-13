import type { Metadata } from "next";
import { PageShell } from "@/components/shared/page-shell";
import { PageIntro } from "@/components/shared/page-intro";
import { SectionHeading } from "@/components/shared/section-heading";
import { ImageStudio } from "@/components/experiments/image-studio";
import { Sparkles, Cpu, Zap, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "AI 创意视觉工坊 · 双通道 FLUX 极速生图负载均衡",
  description:
    "结合 Cloudflare Workers AI 与 Pollinations.ai 的双通道高可用 AI 生图工坊。支持 FLUX.1 真实神经渲染、轮询负载均衡与毫秒级故障自动容灾降级。",
  alternates: { canonical: "/experiments/image-studio" },
};

export default function ImageStudioPage() {
  return (
    <PageShell>
      <PageIntro>
        {/* 顶部标签 */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 text-xs font-mono font-medium">
              <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 animate-pulse" />
              <span>FLUX.1 DUAL ENGINE // CLOUDFLARE AI + POLLINATIONS</span>
            </div>

            <div className="hidden sm:flex items-center gap-4 text-xs font-mono text-muted-foreground border border-slate-900/10 dark:border-slate-800 rounded-full px-3.5 py-1 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xs">
              <span className="flex items-center gap-1.5 text-foreground font-semibold">
                <Cpu className="h-3.5 w-3.5 text-purple-600" />
                <span>CF FLUX 极速推理</span>
              </span>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span>双通道智能负载均衡</span>
              </span>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <span className="flex items-center gap-1.5 text-pink-600 font-semibold">
                <Zap className="h-3.5 w-3.5 text-pink-600" />
                <span>全自动容灾切换</span>
              </span>
            </div>
          </div>

          <SectionHeading
            level={1}
            eyebrow="AI 视觉实验室 · CREATIVE AI STUDIO"
            title="AI 创意视觉工坊"
            description="基于 Cloudflare Workers AI 极速算力与 Pollinations FLUX.1 真实推理引擎的双通道高可用生图工坊。支持中英双语提示词、多风格艺术预设与画幅自由切换，自动执行负载轮询与毫秒级故障容灾。"
          />
        </div>

        {/* 核心工作台 */}
        <div className="mt-4">
          <ImageStudio />
        </div>
      </PageIntro>
    </PageShell>
  );
}
