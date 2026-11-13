import type { Metadata } from "next";
import { PageShell } from "@/components/shared/page-shell";
import { PageIntro } from "@/components/shared/page-intro";
import { SectionHeading } from "@/components/shared/section-heading";
import { AITownCanvas } from "@/components/experiments/ai-town-canvas";
import { Users, Bot, MessageCircle, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "AI 智能体虚拟小镇 · Generative Agents Town",
  description:
    "受斯坦福 AI Town 启发的自主智能体沙盒。NPC 居民自主漫游、工作、偶遇八卦与社交，玩家可以上帝视角观察或亲自走进小镇交谈互动。",
  alternates: { canonical: "/experiments/ai-town" },
};

export default function AITownPage() {
  return (
    <PageShell>
      <PageIntro>
        {/* 顶部标签 */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 text-xs font-mono font-medium">
              <Users className="w-3.5 h-3.5 text-cyan-600 animate-pulse" />
              <span>AGENT SOCIETY // GENERATIVE MULTI-AGENT SANDBOX</span>
            </div>

            <div className="hidden sm:flex items-center gap-4 text-xs font-mono text-muted-foreground border border-slate-900/10 rounded-full px-3.5 py-1 bg-white/60 backdrop-blur-xs">
              <span className="flex items-center gap-1.5 text-foreground font-semibold">
                <Bot className="h-3.5 w-3.5 text-cyan-600" />
                <span>自主寻路与漫游</span>
              </span>
              <span className="text-slate-300">|</span>
              <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
                <span>动态相遇与对白生成</span>
              </span>
              <span className="text-slate-300">|</span>
              <span className="flex items-center gap-1.5 text-amber-600 font-semibold">
                <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                <span>全镇大喇叭事件扩散</span>
              </span>
            </div>
          </div>

          <SectionHeading
            level={1}
            eyebrow="自主智能体实验 · AGENT LAB"
            title="AI 智能体虚拟社交小镇"
            description="一个充满生机的 2D 智能体自治沙盒。小镇里生活着 AI 架构师、全栈黑客、量化策略师等居民。它们会在建筑间穿梭漫步、相遇攀谈，你可以以玩家身份游览小镇与它们一对一交谈，或使用全镇广播激发链式群聊反应。"
          />
        </div>

        {/* 核心画布容器 */}
        <div className="mt-6">
          <AITownCanvas />
        </div>
      </PageIntro>
    </PageShell>
  );
}
