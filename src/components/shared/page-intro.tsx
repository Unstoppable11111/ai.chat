"use client";

import { cn } from "@/lib/utils";

type PageIntroProps = {
  children: React.ReactNode;
  className?: string;
};

export function PageIntro({ children, className }: PageIntroProps) {
  return (
    <div className={cn(className)}>
      {children}
    </div>
  );
}
