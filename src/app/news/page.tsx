import type { Metadata } from "next";
import { NewsCard } from "@/components/cards/news-card";
import { Reveal } from "@/components/shared/reveal";
import { PageIntro } from "@/components/shared/page-intro";
import { PageShell } from "@/components/shared/page-shell";
import { SectionHeading } from "@/components/shared/section-heading";
import { listPublishedPosts, postListItem } from "@/lib/posts-repository";
import { Radio } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "科技资讯",
  description: "每日最新 AI 与科技前沿动态抓取与总结。",
  alternates: { canonical: "/news" },
};

export default async function NewsPage() {
  const items = (await listPublishedPosts("news")).map(postListItem);
  const featuredItem = items[0];
  const remainingItems = items.slice(1);

  return (
    <PageShell>
      <PageIntro>
        {/* 顶部科技资讯雷达监控条 */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan text-xs font-mono font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-cyan opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-cyan" />
              </span>
              <span>LIVE INTEL STREAM // TECH RADAR FEED</span>
            </div>

            <div className="hidden sm:flex items-center gap-4 text-xs font-mono text-muted-foreground border border-slate-900/10 rounded-full px-3.5 py-1 bg-white/60 backdrop-blur-xs">
              <span className="flex items-center gap-1.5 text-foreground font-semibold">
                <Radio className="h-3.5 w-3.5 text-brand-cyan animate-pulse" />
                <span>INTEL DISPATCHES: {items.length} 篇速递</span>
              </span>
              <span className="text-slate-300">|</span>
              <span className="text-emerald-600 font-semibold">SYNC: REALTIME DAILY</span>
            </div>
          </div>

          <SectionHeading
            level={1}
            eyebrow="全球科技前沿速递 · GLOBAL INTEL"
            title="科技资讯"
            description="聚焦大模型演进、硬件算力、端侧智能与开源生态的核心技术动态透视与深度解读。"
          />
        </div>

        {/* 焦点头条 + 资讯流栅格 */}
        <div className="space-y-6">
          {featuredItem && (
            <Reveal once>
              <NewsCard item={featuredItem} variant="feature" />
            </Reveal>
          )}

          {remainingItems.length > 0 && (
            <div className="grid gap-5 md:grid-cols-2">
              {remainingItems.map((item, index) => (
                <Reveal key={item.slug} delay={index * 0.05} once>
                  <NewsCard item={item} />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </PageIntro>
    </PageShell>
  );
}
