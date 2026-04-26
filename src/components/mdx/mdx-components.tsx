import Link from "next/link";
import type { MDXComponents } from "mdx/types";
import { PromptBlock } from "@/components/mdx/prompt-block";

export const mdxComponents: MDXComponents = {
  a: (props) => (
    <Link
      {...props}
      href={props.href ?? "#"}
      className="text-brand-cyan underline-offset-4 hover:underline"
    />
  ),
  PromptBlock,
};
