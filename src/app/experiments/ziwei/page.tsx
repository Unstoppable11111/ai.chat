import type { Metadata } from "next";
import { PageShell } from "@/components/shared/page-shell";
import { PageIntro } from "@/components/shared/page-intro";
import { SectionHeading } from "@/components/shared/section-heading";
import { ZiweiStudio } from "@/components/experiments/ziwei-studio";
import { Sparkles, Compass, HeartHandshake, ScrollText } from "lucide-react";

export const metadata: Metadata = {
  title: "天纪紫微斗数 · AI 命盘精批与双人合盘全息系统",
  description:
    "融合倪海厦《天纪》易学体系与《紫微斗数全书》《骨髓赋》的紫微斗数排盘与 AI 命理批断平台。支持全国省市真太阳时校正、1986–1991 夏令时校准、本命/大限/流年四化飞星、双人合盘五步法、13 维全息断语及三大古籍原典检索。",
  alternates: { canonical: "/experiments/ziwei" },
};

export default function ZiweiPage() {
  return (
    <PageShell>
      <PageIntro>
        <div className="mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-mono font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>TIANJI ASTROLABE // 倪海厦《天纪》体系 + 《斗数全书》金标准盘引擎</span>
            </div>

            <div className="hidden sm:flex items-center gap-4 text-xs font-mono text-slate-400 border border-white/10 rounded-full px-3.5 py-1 bg-[#060a14]/80 backdrop-blur-xs">
              <span className="flex items-center gap-1.5 text-amber-300 font-semibold">
                <Compass className="h-3.5 w-3.5 text-amber-400" />
                <span>真太阳时 & 十二宫三方四正</span>
              </span>
              <span className="text-white/15">|</span>
              <span className="flex items-center gap-1.5 text-rose-300 font-semibold">
                <HeartHandshake className="h-3.5 w-3.5 text-rose-400" />
                <span>双宫联参合盘五步法</span>
              </span>
              <span className="text-white/15">|</span>
              <span className="flex items-center gap-1.5 text-emerald-300 font-semibold">
                <ScrollText className="h-3.5 w-3.5 text-emerald-400" />
                <span>游客免费 3 次 AI · 登录无限畅享</span>
              </span>
            </div>
          </div>

          <SectionHeading
            level={1}
            eyebrow="东方数理哲学实验室 · ZIWEI DOUSHU & SANJI SYSTEM"
            title="天纪 · 紫微斗数全息命盘与 AI 宗师批断工坊"
            description="深度融合倪海厦《天纪》三合派心法与《紫微斗数全书》《骨髓赋》古典法度。支持全国经度真太阳时与均时差校准、本命/大限/流年四化叠层、13 维确定性秒级断语、双人姻缘合盘、三大古籍全文检索与天纪·地纪·人纪五术学堂。"
          />
        </div>

        <div className="mt-4">
          <ZiweiStudio />
        </div>
      </PageIntro>
    </PageShell>
  );
}
