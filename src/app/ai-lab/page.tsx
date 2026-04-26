import type { Metadata } from "next";
import { AiLabGrid } from "@/components/pages/ai-lab-grid";
import { PageIntro } from "@/components/shared/page-intro";
import { PageShell } from "@/components/shared/page-shell";
import { SectionHeading } from "@/components/shared/section-heading";
import { getAiLabEntries } from "@/lib/content";

export const metadata: Metadata = {
  title: "AI Lab",
  description: "一个持续更新的 AI 视觉实验档案库。",
};

export default function AiLabPage() {
  const items = getAiLabEntries();

  return (
    <PageShell>
      <PageIntro>
        <SectionHeading
          eyebrow="AI Lab"
          title="AI Lab"
          description="一个持续更新的 AI 生成视觉实验档案库。"
        />
        <AiLabGrid items={items} />
      </PageIntro>
    </PageShell>
  );
}
