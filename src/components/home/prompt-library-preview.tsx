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
        title="提示词库预览"
        description="这里的提示词不是零散记录，而是可以复用、可以继续打磨的构建模块。"
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
