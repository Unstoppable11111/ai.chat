import { currentlyBuilding } from "@/data/site";
import { Reveal } from "@/components/shared/reveal";
import { SectionHeading } from "@/components/shared/section-heading";

export function CurrentlyBuilding() {
  return (
    <section className="studio-section">
      <SectionHeading
        eyebrow="工作流状态"
        title="当前在构建"
        description="快速查看这个工作室现在正在推进的几件事情。"
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {currentlyBuilding.map((item, index) => (
          <Reveal key={item} delay={index * 0.05} once>
            <div className="glass-panel flex h-full rounded-[24px] p-5">
              <div className="mb-4 flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-muted-foreground">
                <span className="h-2.5 w-2.5 rounded-full bg-brand-lime shadow-[0_0_18px_rgba(101,163,13,0.35)]" />
                进行中
              </div>
              <p className="text-sm leading-7 text-foreground/90">{item}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
