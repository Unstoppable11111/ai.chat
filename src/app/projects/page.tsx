import type { Metadata } from "next";
import { ProjectCard } from "@/components/cards/project-card";
import { Reveal } from "@/components/shared/reveal";
import { PageIntro } from "@/components/shared/page-intro";
import { PageShell } from "@/components/shared/page-shell";
import { SectionHeading } from "@/components/shared/section-heading";
import { getProjects } from "@/lib/content";

export const metadata: Metadata = {
  title: "项目案例",
  description: "精选的系统、视觉实验与数字产品案例。",
};

export default function ProjectsPage() {
  const items = getProjects();

  return (
    <PageShell>
      <PageIntro>
        <SectionHeading
          eyebrow="精选作品"
          title="项目案例"
          description="精选的系统、视觉实验与数字产品案例。"
        />
        <div className="grid gap-5 xl:grid-cols-2">
          {items.map((item, index) => (
            <Reveal key={item.slug} delay={index * 0.05} once>
              <ProjectCard item={item} />
            </Reveal>
          ))}
        </div>
      </PageIntro>
    </PageShell>
  );
}
