import { ExperimentCard } from "@/components/cards/experiment-card";
import { Reveal } from "@/components/shared/reveal";
import { SectionHeading } from "@/components/shared/section-heading";
import type { ExperimentEntry } from "@/lib/types";

type FeaturedExperimentsProps = {
  items: ExperimentEntry[];
};

export function FeaturedExperiments({ items }: FeaturedExperimentsProps) {
  return (
    <section className="studio-section">
      <SectionHeading
        eyebrow="精选实验"
        title="精选技术实验"
        description="几组代表性的网站视觉、页面构建和提示词学习记录。"
      />
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item, index) => (
          <Reveal key={item.slug} delay={index * 0.04} once>
            <ExperimentCard item={item} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}
