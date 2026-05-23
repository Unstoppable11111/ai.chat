import { BentoGrid } from "@/components/home/bento-grid";
import { CurrentlyBuilding } from "@/components/home/currently-building";
import { FeaturedExperiments } from "@/components/home/featured-experiments";
import { HeroSection } from "@/components/home/hero-section";
import { LatestBuildLogs } from "@/components/home/latest-build-logs";
import { ManifestoSection } from "@/components/home/manifesto-section";
import { PromptLibraryPreview } from "@/components/home/prompt-library-preview";
import { StudioPulse } from "@/components/home/studio-pulse";
import { PageIntro } from "@/components/shared/page-intro";
import { PageShell } from "@/components/shared/page-shell";
import { promptLibrary } from "@/data/site";
import { getBuildLogs, getExperimentEntries } from "@/lib/content";

export default function HomePage() {
  const experimentEntries = getExperimentEntries().slice(0, 6);
  const buildLogs = getBuildLogs().slice(0, 3);

  return (
    <PageShell>
      <PageIntro>
        <HeroSection />
        <CurrentlyBuilding />
        <BentoGrid />
        <FeaturedExperiments items={experimentEntries} />
        <LatestBuildLogs items={buildLogs} />
        <PromptLibraryPreview items={promptLibrary.slice(0, 3)} />
        <StudioPulse />
        <ManifestoSection />
      </PageIntro>
    </PageShell>
  );
}
