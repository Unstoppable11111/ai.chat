import type { Metadata } from "next";
import { PageShell } from "@/components/shared/page-shell";
import { PageIntro } from "@/components/shared/page-intro";
import { SectionHeading } from "@/components/shared/section-heading";
import { PelicanArena } from "@/components/experiments/pelican-arena";

export const metadata: Metadata = {
  title: "鹈鹕骑车 · AI 跨模型趣味盲测竞技场",
  description: "同一个高难度 SVG 动画 Prompt『鹈鹕骑车』下，国内外 5 大顶尖大模型（DeepSeek、Kimi、GPT、Gemini、Grok）的代码与动效大乱斗。",
  alternates: { canonical: "/experiments/pelican" },
};

export default function PelicanPage() {
  return (
    <PageShell>
      <PageIntro>
        <SectionHeading
          level={1}
          eyebrow="AI 趣味横评 · THE PELICAN BENCHMARK"
          title="鹈鹕骑车 · 跨模型盲测竞技场"
          description="同一个统一提示词，5 款顶尖大模型（3 款国外 + 2 款国内）各显神通。涵盖生物解剖特征、机械曲柄踩踏联动与矢量动画代码全方位较量。"
        />
        <PelicanArena />
      </PageIntro>
    </PageShell>
  );
}
