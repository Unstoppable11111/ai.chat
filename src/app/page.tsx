import type { Metadata } from "next";
import { CurrentlyBuilding } from "@/components/home/currently-building";
import { FeaturedExperiments } from "@/components/home/featured-experiments";
import { HeroSection } from "@/components/home/hero-section";
import { LatestBuildLogs } from "@/components/home/latest-build-logs";
import { ManifestoSection } from "@/components/home/manifesto-section";
import { PromptLibraryPreview } from "@/components/home/prompt-library-preview";
import { StackingPanels } from "@/components/home/stacking-panels";
import { PageIntro } from "@/components/shared/page-intro";
import { promptLibrary } from "@/data/site";
import { getBuildLogs, getExperimentEntries } from "@/lib/content";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function HomePage() {
  const experimentEntries = getExperimentEntries().slice(0, 6);
  const buildLogs = getBuildLogs().slice(0, 3);

  return (
    <main className="page-flow pb-20 overflow-x-hidden">
      <PageIntro>
        <HeroSection />
        <CurrentlyBuilding />
        <StackingPanels />
        <FeaturedExperiments items={experimentEntries} />
        <LatestBuildLogs items={buildLogs} />
        <PromptLibraryPreview items={promptLibrary.slice(0, 3)} />
        <ManifestoSection />
      </PageIntro>
    </main>
  );
}
