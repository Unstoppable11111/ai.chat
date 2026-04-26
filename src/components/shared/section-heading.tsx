import type { ReactNode } from "react";

type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
}: SectionHeadingProps) {
  return (
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        {eyebrow ? (
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.24em] text-brand-cyan">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
          {title}
        </h2>
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
