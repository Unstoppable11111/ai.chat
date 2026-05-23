import type { Metadata } from "next";
import { ExperimentGrid } from "@/components/pages/experiment-grid";
import { PageIntro } from "@/components/shared/page-intro";
import { PageShell } from "@/components/shared/page-shell";
import { SectionHeading } from "@/components/shared/section-heading";
import { getExperimentEntries } from "@/lib/content";

export const metadata: Metadata = {
  title: "实验记录",
  description: "一个持续更新的网站视觉、页面构建与技术实验记录。",
};

export default function ExperimentsPage() {
  const items = getExperimentEntries();

  return (
    <PageShell>
      <PageIntro>
        <SectionHeading
          eyebrow="实验记录"
          title="实验记录"
          description="一个持续更新的网站视觉、页面构建与技术实验记录。"
        />
        <ExperimentGrid items={items} />
      </PageIntro>
    </PageShell>
  );
}
