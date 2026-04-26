import type { Metadata } from "next";
import { PromptLibraryExplorer } from "@/components/pages/prompt-library-explorer";
import { PageIntro } from "@/components/shared/page-intro";
import { PageShell } from "@/components/shared/page-shell";
import { SectionHeading } from "@/components/shared/section-heading";
import { promptLibrary } from "@/data/site";

export const metadata: Metadata = {
  title: "提示词库",
  description: "用于 AI 生图、产品视觉与创意实验的可复用提示词库。",
};

export default function PromptsPage() {
  return (
    <PageShell>
      <PageIntro>
        <SectionHeading
          eyebrow="提示词系统"
          title="提示词库"
          description="用于 AI 生图、产品视觉与创意实验的可复用提示词库。"
        />
        <PromptLibraryExplorer items={promptLibrary} />
      </PageIntro>
    </PageShell>
  );
}
