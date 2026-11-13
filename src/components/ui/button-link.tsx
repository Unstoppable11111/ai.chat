import Link from "next/link";
import { cn } from "@/lib/utils";

type ButtonLinkProps = {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
};

export function ButtonLink({
  href,
  children,
  variant = "primary",
  className,
}: ButtonLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-medium",
        variant === "primary" &&
          "bg-foreground text-background hover:-translate-y-0.5",
        variant === "secondary" &&
          "border border-white/15 bg-[#060a14] text-slate-200 hover:-translate-y-0.5 hover:border-cyan-500/40 hover:text-white transition-all",
        variant === "ghost" && "text-muted-foreground hover:text-foreground",
        className,
      )}
    >
      {children}
    </Link>
  );
}
