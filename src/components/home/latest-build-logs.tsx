import { BuildLogCard } from "@/components/cards/build-log-card";
import { Reveal } from "@/components/shared/reveal";
import { SectionHeading } from "@/components/shared/section-heading";
import type { BuildLogEntry } from "@/lib/types";

type LatestBuildLogsProps = {
  items: BuildLogEntry[];
};

export function LatestBuildLogs({ items }: LatestBuildLogsProps) {
  const [latest, ...rest] = items;

  return (
    <section className="studio-section">
      <SectionHeading
        eyebrow="最新记录"
        title="最新构建日志"
        description="比起博客，更像是我用 AI、设计和代码快速构建时留下的现场笔记。"
      />
      <div className="grid gap-5">
        {latest ? (
          <Reveal delay={0} once>
            <BuildLogCard item={latest} variant="feature" />
          </Reveal>
        ) : null}
        <div className="grid gap-5 md:grid-cols-2">
          {rest.map((item, index) => (
            <Reveal key={item.slug} delay={(index + 1) * 0.05} once>
              <BuildLogCard item={item} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
