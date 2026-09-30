import type { Metadata } from "next";
import { ExperimentGrid } from "@/components/pages/experiment-grid";
import { PageIntro } from "@/components/shared/page-intro";
import { PageShell } from "@/components/shared/page-shell";
import { SectionHeading } from "@/components/shared/section-heading";
import { listPublishedPosts, experimentListItem } from "@/lib/posts-repository";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "实验记录",
  description: "一个持续更新的网站视觉、页面构建与技术实验记录。",
  alternates: { canonical: "/experiments" },
};

export default async function ExperimentsPage() {
  const items = (await listPublishedPosts("experiments")).map(experimentListItem);

  return (
    <PageShell>
      <PageIntro>
        <SectionHeading
          level={1}
          eyebrow="视觉与交互实验室 · CREATIVE CODING LAB"
          title="实验记录"
          description="一个持续演进的视觉着色器、提示词工程与三维多模态技术实验档案库。"
        />
        <ExperimentGrid items={items} />
      </PageIntro>
    </PageShell>
  );
}
