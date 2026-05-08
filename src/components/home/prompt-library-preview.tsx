import Image from "next/image";
import { PromptCard } from "@/components/cards/prompt-card";
import { Reveal } from "@/components/shared/reveal";
import { SectionHeading } from "@/components/shared/section-heading";
import type { PromptEntry } from "@/lib/types";

type PromptLibraryPreviewProps = {
  items: PromptEntry[];
};

export function PromptLibraryPreview({ items }: PromptLibraryPreviewProps) {
  const [featured, ...rest] = items;

  return (
    <section className="studio-section">
      <SectionHeading
        eyebrow="可复用资产"
        title="提示词库预览"
        description="这里的提示词不是零散记录，而是可以复用、可以继续打磨的构建模块。"
      />
      <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        {featured ? (
          <Reveal delay={0} once>
            <PromptCard item={featured} />
          </Reveal>
        ) : null}
        <div className="grid gap-4">
          {rest.map((item, index) => (
            <Reveal key={item.id} delay={(index + 1) * 0.05} once>
              <article className="grid gap-4 border-b border-slate-900/8 bg-white/34 pb-4 md:grid-cols-[180px_1fr] md:items-center">
                <div className="relative aspect-[16/10] overflow-hidden rounded-[18px] border border-slate-900/8">
                  <Image
                    src={item.exampleImage}
                    alt={item.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 180px"
                  />
                </div>
                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    <span>{item.category}</span>
                    <span>{item.model}</span>
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">{item.summary}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {item.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-slate-900/8 bg-white/62 px-3 py-1 text-xs text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
