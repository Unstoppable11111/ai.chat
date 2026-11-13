import { Children, isValidElement, type ReactNode } from "react";
import { CopyButton } from "@/components/ui/copy-button";

type PromptBlockProps = {
  title?: string;
  prompt?: string;
  children?: ReactNode;
};

function extractText(node: ReactNode): string {
  return Children.toArray(node)
    .map((child) => {
      if (typeof child === "string" || typeof child === "number") {
        return String(child);
      }

      if (isValidElement<{ children?: ReactNode }>(child)) {
        return extractText(child.props.children);
      }

      return "";
    })
    .join("")
    .trim();
}

export function PromptBlock({
  title = "提示词学习资料",
  prompt,
  children,
}: PromptBlockProps) {
  const content = (typeof prompt === "string" ? prompt : extractText(children)).trim();

  return (
    <div className="my-6 rounded-xl border border-cyan-500/30 bg-[#080d1a] p-5 shadow-[0_18px_48px_rgba(0,0,0,0.45)]">
      <div className="mb-3 flex items-center justify-between gap-4 border-b border-white/10 pb-2.5">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-cyan-300 font-semibold">
          {title}
        </p>
        <CopyButton value={content} />
      </div>
      <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg border border-white/10 bg-[#04060b] p-4 font-mono text-xs sm:text-sm leading-7 text-slate-200">
        {content}
      </pre>
    </div>
  );
}
