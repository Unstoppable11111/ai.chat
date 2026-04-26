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
  title = "可复用提示词",
  prompt,
  children,
}: PromptBlockProps) {
  const content = (typeof prompt === "string" ? prompt : extractText(children)).trim();

  return (
    <div className="my-6 rounded-[24px] border border-brand-cyan/22 bg-brand-cyan/10 p-5 shadow-[0_18px_56px_rgba(14,165,233,0.10)]">
      <div className="mb-3 flex items-center justify-between gap-4">
        <p className="text-xs uppercase tracking-[0.24em] text-brand-cyan">
          {title}
        </p>
        <CopyButton value={content} />
      </div>
      <pre className="overflow-x-auto whitespace-pre-wrap rounded-[18px] border border-slate-900/8 bg-white/78 p-4 text-sm leading-7 text-foreground/84">
        {content}
      </pre>
    </div>
  );
}
