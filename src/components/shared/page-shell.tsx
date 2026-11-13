import { cn } from "@/lib/utils";

type PageShellProps = {
  children: React.ReactNode;
  className?: string;
};

export function PageShell({ children, className }: PageShellProps) {
  return (
    <div className={cn("container-shell page-flow pb-24 pt-4 sm:pt-6", className)}>
      {children}
    </div>
  );
}
