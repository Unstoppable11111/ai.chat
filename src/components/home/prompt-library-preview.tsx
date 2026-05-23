import { PromptCard } from "@/components/cards/prompt-card";
import { Reveal } from "@/components/shared/reveal";
import { SectionHeading } from "@/components/shared/section-heading";
import type { PromptEntry } from "@/lib/types";

type PromptLibraryPreviewProps = {
  items: PromptEntry[];
};

export function PromptLibraryPreview({ items }: PromptLibraryPreviewProps) {
  return (
    <section className="studio-section">
      <SectionHeading
        eyebrow="可复用资产"
        title="学习笔记预览"
        description="这里整理提示词学习资料、视觉表达笔记和可复用的页面构建思路。"
      />
      <div className="grid gap-5 xl:grid-cols-3">
        {items.map((item, index) => (
          <Reveal key={item.id} delay={index * 0.05} once>
            <PromptCard item={item} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}
