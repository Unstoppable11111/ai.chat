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
          <div className="mb-3 inline-flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-cyan shadow-[0_0_8px_rgba(14,165,233,0.8)]" />
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-brand-cyan">
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
