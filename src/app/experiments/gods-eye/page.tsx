import type { Metadata } from "next";
import { PageShell } from "@/components/shared/page-shell";
import { PageIntro } from "@/components/shared/page-intro";
import { SectionHeading } from "@/components/shared/section-heading";
import { GodsEyeConsole } from "@/components/experiments/gods-eye-console";
import { Globe, Satellite, Eye, Radio } from "lucide-react";

export const metadata: Metadata = {
  title: "上帝之眼 · 全球态势感知与 3D 空间智能大屏",
  description:
    "基于 CesiumJS 与国家自然资源部天地图高精卫星遥感构建的数字孪生地球，实时汇聚全球航线、远洋船舶、中国天宫空间站与北斗导航卫星轨道态势。",
  alternates: { canonical: "/experiments/gods-eye" },
};

export default function GodsEyePage() {
  return (
    <PageShell>
      <PageIntro>
        {/* 顶部空间情报雷达标签栏 */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 text-xs font-mono font-medium">
              <Satellite className="w-3.5 h-3.5 text-cyan-600 animate-pulse" />
              <span>SPATIAL INTELLIGENCE // TIANDITU 4K SATELLITE</span>
            </div>

            <div className="hidden sm:flex items-center gap-4 text-xs font-mono text-muted-foreground border border-slate-900/10 rounded-full px-3.5 py-1 bg-white/60 backdrop-blur-xs">
              <span className="flex items-center gap-1.5 text-foreground font-semibold">
                <Globe className="h-3.5 w-3.5 text-cyan-600" />
                <span>国家天地图 4K 遥感</span>
              </span>
              <span className="text-slate-300">|</span>
              <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                <Radio className="h-3.5 w-3.5 text-emerald-600" />
                <span>天宫 &amp; 北斗三维态势</span>
              </span>
              <span className="text-slate-300">|</span>
              <span className="flex items-center gap-1.5 text-amber-600 font-semibold">
                <Eye className="h-3.5 w-3.5 text-amber-600" />
                <span>FLIR 战术夜视</span>
              </span>
            </div>
          </div>

          <SectionHeading
            level={1}
            eyebrow="空间数字孪生 · SPATIAL TWIN LAB"
            title="上帝之眼 · 全球态势与空间智能控制台"
            description="基于 CesiumJS 与国家自然资源部天地图高精卫星影像构建的三维地球大屏。国内极速直连秒开，集成全球实时民航追踪、远洋船舶动态、天宫空间站与北斗导航卫星过境，配备军工级 FLIR 热成像与战术微光夜视滤镜。"
          />
        </div>

        {/* 核心沉浸式控制台挂载 */}
        <div className="mt-6">
          <GodsEyeConsole />
        </div>
      </PageIntro>
    </PageShell>
  );
}
