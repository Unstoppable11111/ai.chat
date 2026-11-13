import type { Metadata } from "next";
import { QuantArenaPreview } from "@/components/home/quant-arena-preview";
import { WorkflowPreview } from "@/components/home/workflow-preview";
import { InteractiveLabShowcase } from "@/components/home/interactive-lab-showcase";
import { HeroSection } from "@/components/home/hero-section";
import { LatestBuildLogs } from "@/components/home/latest-build-logs";
import { PageIntro } from "@/components/shared/page-intro";
import { listPublishedPostSummaries, postListItem } from "@/lib/posts-repository";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export const dynamic = "force-dynamic";
export default async function HomePage() {
  const buildLogPosts = await listPublishedPostSummaries("build-log");
  const buildLogs = buildLogPosts.slice(0, 4).map(postListItem);

  return (
    <div className="page-flow pb-14 overflow-x-clip">
      <PageIntro>
        <HeroSection />
        <QuantArenaPreview />
        <WorkflowPreview />
        <InteractiveLabShowcase />
        <LatestBuildLogs items={buildLogs} />
      </PageIntro>
    </div>
  );
}
