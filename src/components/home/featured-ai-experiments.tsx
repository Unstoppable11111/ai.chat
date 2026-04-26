import { AIWorkCard } from "@/components/cards/ai-work-card";
import { Reveal } from "@/components/shared/reveal";
import { SectionHeading } from "@/components/shared/section-heading";
import type { AiLabEntry } from "@/lib/types";

type FeaturedAIExperimentsProps = {
  items: AiLabEntry[];
};

export function FeaturedAIExperiments({ items }: FeaturedAIExperimentsProps) {
  return (
    <section className="studio-section">
      <SectionHeading
        eyebrow="精选实验"
        title="精选 AI 实验"
        description="几组代表性的视觉实验，展示这个工作室的审美判断、迭代方式和提示词思路。"
      />
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item, index) => (
          <Reveal key={item.slug} delay={index * 0.04} once>
            <AIWorkCard item={item} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}
