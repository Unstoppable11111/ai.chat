import type { ReactNode } from "react";
import { Reveal } from "@/components/shared/reveal";

type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  level?: 1 | 2;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  level = 2,
}: SectionHeadingProps) {
  const Heading = level === 1 ? "h1" : "h2";

  return (
    <Reveal
      className="mb-10 border-t border-white/12 pt-5 flex flex-col gap-5 md:flex-row md:items-end md:justify-between"
      distance={16}
    >
      <div className="max-w-3xl">
        {eyebrow ? (
          <div className="mb-3 inline-flex items-center gap-2 rounded border border-cyan-500/30 bg-cyan-950/35 px-2.5 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f0ff]" />
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-300">
              [ {eyebrow} ]
            </p>
          </div>
        ) : null}
        <Heading className="text-3xl font-bold tracking-tight text-white md:text-5xl leading-[1.08]">
          {title}
        </Heading>
        {description ? (
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400 md:text-base">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </Reveal>
  );
}
