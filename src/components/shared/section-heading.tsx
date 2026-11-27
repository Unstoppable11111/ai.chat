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
    <Reveal className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between" distance={16}>
      <div className="max-w-2xl">
        {eyebrow ? (
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#184120]/20 bg-[#E0E7D9]/65 px-3 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[#184120]" />
            <p className="text-[11px] font-mono font-semibold uppercase tracking-[0.2em] text-[#184120]">
              {eyebrow}
            </p>
          </div>
        ) : null}
        <Heading className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
          {title}
        </Heading>
        {description ? (
          <p className="mt-3 text-sm leading-7 text-muted-foreground md:text-base">
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </Reveal>
  );
}
