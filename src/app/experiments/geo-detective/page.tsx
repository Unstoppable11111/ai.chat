import type { Metadata } from "next";
import { PageShell } from "@/components/shared/page-shell";
import { PageIntro } from "@/components/shared/page-intro";
import { SectionHeading } from "@/components/shared/section-heading";
import { GeoDetectiveGame } from "@/components/experiments/geo-detective-game";
import { Compass, Globe, MapPin, Search } from "lucide-react";

export const metadata: Metadata = {
  title: "地理大侦探·街景寻踪 · Geo Detective",
  description:
    "风靡全球的 GeoGuessr 风格地理探案竞猜。通过植被、路标、太阳方位等线索在世界地图上插旗，计算公里误差并冲击最高得分！",
  alternates: { canonical: "/experiments/geo-detective" },
};

export default function GeoDetectivePage() {
  return (
    <PageShell>
      <PageIntro>
        {/* 顶部标签 */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-medium">
              <Compass className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>GEOLOCATION PUZZLE // HAVERSINE SPATIAL DISTANCE</span>
            </div>

            <div className="hidden sm:flex items-center gap-4 text-xs font-mono text-slate-400 border border-white/10 rounded-full px-3.5 py-1 bg-[#060a14]/80 backdrop-blur-xs">
              <span className="flex items-center gap-1.5 text-white font-semibold">
                <Globe className="h-3.5 w-3.5 text-cyan-400" />
                <span>全球高精实景库</span>
              </span>
              <span className="text-white/15">|</span>
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <MapPin className="h-3.5 w-3.5 text-emerald-400" />
                <span>实时经纬度换算</span>
              </span>
              <span className="text-white/15">|</span>
              <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
                <Search className="h-3.5 w-3.5 text-amber-400" />
                <span>多维度环境线索推断</span>
              </span>
            </div>
          </div>

          <SectionHeading
            level={1}
            eyebrow="空间探案竞猜 · PLAYGROUND"
            title="地理大侦探 · 街景寻踪"
            description="置身于世界各地的神秘街景之中，观察阳光阴影、植被气候、车道线与文字招牌等蛛丝马迹，在世界地图上插下旗帜预测你的真实位置，比拼谁是真正的空间福尔摩斯！"
          />
        </div>

        {/* 核心游戏组件 */}
        <div className="mt-6">
          <GeoDetectiveGame />
        </div>
      </PageIntro>
    </PageShell>
  );
}
