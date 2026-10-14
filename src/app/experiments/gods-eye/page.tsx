import type { Metadata } from "next";
import { PageShell } from "@/components/shared/page-shell";
import { PageIntro } from "@/components/shared/page-intro";
import { SectionHeading } from "@/components/shared/section-heading";
import { GodsEyeConsole } from "@/components/experiments/gods-eye-console";
import { Globe, Satellite, Eye, Radio } from "lucide-react";

export const metadata: Metadata = {
  title: "上帝之眼 · 全球态势感知与 3D 空间智能大屏",
  description:
    "集成开源项目 God's Eye View，基于 CesiumJS 与 Google 3D Tiles 构建高拟真数字孪生地球，实时汇聚全球航线、远洋船舶、卫星轨道与红外夜视热成像数据。",
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
              <span>SPATIAL INTELLIGENCE // GOD&apos;S EYE VIEW</span>
            </div>

            <div className="hidden sm:flex items-center gap-4 text-xs font-mono text-muted-foreground border border-slate-900/10 rounded-full px-3.5 py-1 bg-white/60 backdrop-blur-xs">
              <span className="flex items-center gap-1.5 text-foreground font-semibold">
                <Globe className="h-3.5 w-3.5 text-cyan-600" />
                <span>PHOTOREALISTIC 3D TILES</span>
              </span>
              <span className="text-slate-300">|</span>
              <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                <Radio className="h-3.5 w-3.5 text-emerald-600" />
                <span>LIVE OSINT FEEDS</span>
              </span>
              <span className="text-slate-300">|</span>
              <span className="flex items-center gap-1.5 text-amber-600 font-semibold">
                <Eye className="h-3.5 w-3.5 text-amber-600" />
                <span>OPTIC FLIR SHADERS</span>
              </span>
            </div>
          </div>

          <SectionHeading
            level={1}
            eyebrow="空间数字孪生 · SPATIAL TWIN LAB"
            title="上帝之眼 · 全球态势与空间智能控制台"
            description="基于 CesiumJS 与实时遥感/开源数据流构建的三维地球大屏。集成全球实时民航追踪（ADS-B）、远洋船舶动态（AIS）、近地轨道卫星星座监测，配备军用级 FLIR 热成像与微光夜视滤镜。"
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
