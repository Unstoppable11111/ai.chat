import type { Metadata } from "next";
import { NewsCard } from "@/components/cards/news-card";
import { Reveal } from "@/components/shared/reveal";
import { PageIntro } from "@/components/shared/page-intro";
import { PageShell } from "@/components/shared/page-shell";
import { SectionHeading } from "@/components/shared/section-heading";
import { listPublishedPosts, postListItem } from "@/lib/posts-repository";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "科技资讯",
  description: "每日最新 AI 与科技前沿动态抓取与总结。",
  alternates: { canonical: "/news" },
};

export default async function NewsPage() {
  const items = (await listPublishedPosts("news")).map(postListItem);

  return (
    <PageShell>
      <PageIntro>
        <SectionHeading
          level={1}
          eyebrow="新闻与动态"
          title="科技资讯"
          description="科技动态、原始来源与技术解读。"
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
