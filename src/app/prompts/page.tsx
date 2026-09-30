import type { Metadata } from "next";
import { PromptLibraryExplorer } from "@/components/pages/prompt-library-explorer";
import { PageIntro } from "@/components/shared/page-intro";
import { PageShell } from "@/components/shared/page-shell";
import { SectionHeading } from "@/components/shared/section-heading";
import { promptLibrary } from "@/data/site";

export const metadata: Metadata = {
  title: "学习笔记",
  description: "用于提示词学习、产品视觉与创意实验记录的学习资料。",
  alternates: { canonical: "/prompts" },
};

export default function PromptsPage() {
  return (
    <PageShell>
      <PageIntro>
        <SectionHeading
          level={1}
          eyebrow="提示词工程范式 · PROMPT ENGINEERING"
          title="学习笔记"
          description="面向大语言模型推理、影视分镜构图与 Midjourney / Gemini 图像生成的提示词工程资产库。"
        />
        <PromptLibraryExplorer items={promptLibrary} />
      </PageIntro>
    </PageShell>
  );
}
