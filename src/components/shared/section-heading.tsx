import type { ReactNode } from "react";

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
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        {eyebrow ? (
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.24em] text-brand-cyan">
            {eyebrow}
          </p>
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
    </div>
  );
}
