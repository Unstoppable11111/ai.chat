import type { Metadata } from "next";
import { BuildLogCard } from "@/components/cards/build-log-card";
import { Reveal } from "@/components/shared/reveal";
import { PageIntro } from "@/components/shared/page-intro";
import { PageShell } from "@/components/shared/page-shell";
import { SectionHeading } from "@/components/shared/section-heading";
import { getBuildLogs } from "@/lib/content";

export const metadata: Metadata = {
  title: "构建日志",
  description: "记录网站开发、页面搭建、代码构建与学习过程。",
};

export default function BuildLogPage() {
  const items = getBuildLogs();

  return (
    <PageShell>
      <PageIntro>
        <SectionHeading
          eyebrow="构建记录"
          title="构建日志"
          description="记录网站开发、页面搭建、代码构建与学习过程。"
        />

        <div className="grid gap-5 xl:grid-cols-2">
          {items.map((item, index) => (
            <Reveal key={item.slug} delay={index * 0.05} once>
              <BuildLogCard item={item} />
            </Reveal>
          ))}
        </div>
      </PageIntro>
    </PageShell>
  );
}
