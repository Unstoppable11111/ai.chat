import type { Metadata } from "next";
import { NewsCard } from "@/components/cards/news-card";
import { Reveal } from "@/components/shared/reveal";
import { PageIntro } from "@/components/shared/page-intro";
import { PageShell } from "@/components/shared/page-shell";
import { SectionHeading } from "@/components/shared/section-heading";
import { getNews } from "@/lib/content";

export const metadata: Metadata = {
  title: "科技资讯",
  description: "每日最新 AI 与科技前沿动态抓取与总结。",
};

export default function NewsPage() {
  const items = getNews();

  return (
    <PageShell>
      <PageIntro>
        <SectionHeading
          eyebrow="新闻与动态"
          title="科技资讯"
          description="每日自动抓取外网高质量 AI 和科技新闻，由大模型总结提炼。"
        />

        <div className="grid gap-5 xl:grid-cols-2">
          {items.map((item, index) => (
            <Reveal key={item.slug} delay={index * 0.05} once>
              <NewsCard item={item} />
            </Reveal>
          ))}
        </div>
      </PageIntro>
    </PageShell>
  );
}
