import type { Metadata } from "next";
import { PromptLibraryExplorer } from "@/components/pages/prompt-library-explorer";
import { PageIntro } from "@/components/shared/page-intro";
import { PageShell } from "@/components/shared/page-shell";
import { SectionHeading } from "@/components/shared/section-heading";
import { promptLibrary } from "@/data/site";

export const metadata: Metadata = {
  title: "学习笔记",
  description: "用于提示词学习、产品视觉与创意实验记录的学习资料。",
};

export default function PromptsPage() {
  return (
    <PageShell>
      <PageIntro>
        <SectionHeading
          eyebrow="学习资料"
          title="学习笔记"
          description="用于提示词学习、产品视觉与创意实验记录的学习资料。"
        />
        <PromptLibraryExplorer items={promptLibrary} />
      </PageIntro>
    </PageShell>
  );
}
