import type { Metadata } from "next";
import { ExperimentGrid } from "@/components/pages/experiment-grid";
import { InteractivePlaygroundsHub } from "@/components/experiments/interactive-playgrounds-hub";
import { PageIntro } from "@/components/shared/page-intro";
import { PageShell } from "@/components/shared/page-shell";
import { SectionHeading } from "@/components/shared/section-heading";
import { listPublishedPosts, experimentListItem } from "@/lib/posts-repository";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "前沿交互实验室 · Creative Coding & Playgrounds",
  description: "汇聚 3D 遥感地球、流体物理动力学、黑客渗透模拟器、AI 虚拟小镇与多模态手势的独立实验室门户。",
  alternates: { canonical: "/experiments" },
};

export default async function ExperimentsPage() {
  const items = (await listPublishedPosts("experiments")).map(experimentListItem);

  return (
    <PageShell>
      <PageIntro>
        <SectionHeading
          level={1}
          eyebrow="前沿交互与极客工坊 · CREATIVE LABS"
          title="实验室门户"
          description="一个持续演进的视觉着色器、三维空间遥感、自主智能体与高可玩性物理模拟矩阵。"
        />

        {/* 顶部高可玩性交互工坊矩阵 */}
        <InteractivePlaygroundsHub />

        {/* 历史视觉与着色器实验文献 */}
        <div className="pt-6 border-t border-slate-900/10">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-slate-900">视觉构建与提示词实验归档</h3>
            <p className="text-xs text-muted-foreground mt-0.5">网站视觉风格探索、着色器切片与提示词工程档案</p>
          </div>
          <ExperimentGrid items={items} />
        </div>
      </PageIntro>
    </PageShell>
  );
}

