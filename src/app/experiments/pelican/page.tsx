import type { Metadata } from "next";
import { PageShell } from "@/components/shared/page-shell";
import { PageIntro } from "@/components/shared/page-intro";
import { SectionHeading } from "@/components/shared/section-heading";
import { PelicanArena } from "@/components/experiments/pelican-arena";
import { Trophy, Swords } from "lucide-react";

export const metadata: Metadata = {
  title: "鹈鹕骑车 · AI 跨模型趣味盲测竞技场",
  description: "同一个高难度 SVG 动画 Prompt『鹈鹕骑车』下，国内外 5 大顶尖大模型（DeepSeek、Kimi、GPT、Gemini、Grok）的代码与动效大乱斗。",
  alternates: { canonical: "/experiments/pelican" },
};

export default function PelicanPage() {
  return (
    <PageShell>
      <PageIntro>
        {/* 顶部竞技场实时状态雷达 */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-medium">
              <Trophy className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>AI SVG BENCHMARK // PELICAN ARENA</span>
            </div>

            <div className="hidden sm:flex items-center gap-4 text-xs font-mono text-slate-400 border border-white/10 rounded-full px-3.5 py-1 bg-[#060a14]/80 backdrop-blur-xs">
              <span className="flex items-center gap-1.5 text-white font-semibold">
                <Swords className="h-3.5 w-3.5 text-cyan-400" />
                <span>5 FRONTIER MODELS EVALUATED</span>
              </span>
              <span className="text-white/15">|</span>
              <span className="text-emerald-400 font-semibold">ZERO-SHOT SVG ANIMATION</span>
            </div>
          </div>

          <SectionHeading
            level={1}
            eyebrow="AI 趣味横评 · THE PELICAN BENCHMARK"
            title="鹈鹕骑车 · 跨模型盲测竞技场"
            description="同一个统一提示词，5 款顶尖大模型（3 款国外 + 2 款国内）各显神通。涵盖生物解剖特征、机械曲柄踩踏联动与矢量动画代码全方位较量。"
          />
        </div>

        <PelicanArena />
      </PageIntro>
    </PageShell>
  );
}
