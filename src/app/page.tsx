import type { Metadata } from "next";
import { CurrentlyBuilding } from "@/components/home/currently-building";
import { QuantArenaPreview } from "@/components/home/quant-arena-preview";
import { FeaturedExperiments } from "@/components/home/featured-experiments";
import { HeroSection } from "@/components/home/hero-section";
import { LatestBuildLogs } from "@/components/home/latest-build-logs";
import { ManifestoSection } from "@/components/home/manifesto-section";
import { PromptLibraryPreview } from "@/components/home/prompt-library-preview";
import { StackingPanels } from "@/components/home/stacking-panels";
import { PageIntro } from "@/components/shared/page-intro";
import { promptLibrary } from "@/data/site";
import { listPublishedPosts, postListItem, experimentListItem } from "@/lib/posts-repository";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export const dynamic = "force-dynamic";
export default async function HomePage() {
  const experimentEntries = (await listPublishedPosts("experiments")).slice(0,6).map(experimentListItem);
  const buildLogs = (await listPublishedPosts("build-log")).slice(0,3).map(postListItem);

  return (
    <div className="page-flow pb-20 overflow-x-clip">
      <PageIntro>
        <HeroSection />
        <CurrentlyBuilding />
        <QuantArenaPreview />
        <StackingPanels />
        <FeaturedExperiments items={experimentEntries} />
        <LatestBuildLogs items={buildLogs} />
        <PromptLibraryPreview items={promptLibrary.slice(0, 3)} />
        <ManifestoSection />
      </PageIntro>
    </div>
  );
}
