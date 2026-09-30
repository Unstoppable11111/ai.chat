import type { Metadata } from "next";
import { ProjectsExplorer } from "@/components/pages/projects-explorer";
import { PageIntro } from "@/components/shared/page-intro";
import { PageShell } from "@/components/shared/page-shell";
import { SectionHeading } from "@/components/shared/section-heading";
import { listPublishedPosts, projectListItem } from "@/lib/posts-repository";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "项目案例",
  description: "精选的系统、视觉实验与数字产品案例。",
  alternates: { canonical: "/projects" },
};

export default async function ProjectsPage() {
  const items = (await listPublishedPosts("projects")).map(projectListItem);

  return (
    <PageShell>
      <PageIntro>
        <SectionHeading
          level={1}
          eyebrow="精选作品 · ENGINEERING ARCHIVES"
          title="项目案例"
          description="精选的生产系统、着色器视觉实验与端到端数字工程落地案例。"
        />
        <ProjectsExplorer items={items} />
      </PageIntro>
    </PageShell>
  );
}
