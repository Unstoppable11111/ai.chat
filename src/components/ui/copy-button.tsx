"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

type CopyButtonProps = {
  value: string;
};

export function CopyButton({ value }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-[#060a14] px-4 py-2 text-sm text-slate-200 hover:border-cyan-500/40 hover:text-cyan-300 transition-colors cursor-pointer"
    >
      {copied ? <Check className="h-4 w-4 text-brand-lime" /> : <Copy className="h-4 w-4" />}
      {copied ? "已复制" : "复制提示词"}
    </button>
  );
}
