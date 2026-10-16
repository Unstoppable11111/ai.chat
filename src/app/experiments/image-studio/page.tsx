import type { Metadata } from "next";
import { PageShell } from "@/components/shared/page-shell";
import { ImageStudio } from "@/components/experiments/image-studio";

export const metadata: Metadata = {
  title: "AI 创意视觉工坊 · 双通道 FLUX 极速生图负载均衡",
  description:
    "结合 Cloudflare Workers AI 与 Pollinations.ai 的双通道高可用 AI 生图工坊。支持 FLUX.1 真实神经渲染、轮询负载均衡与毫秒级故障自动容灾降级。",
  alternates: { canonical: "/experiments/image-studio" },
};

export default function ImageStudioPage() {
  return (
    <PageShell>
      <ImageStudio />
    </PageShell>
  );
}
