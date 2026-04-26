import Link from "next/link";
import { ExternalLink, Radio, Rss, Sparkles } from "lucide-react";
import { SectionHeading } from "@/components/shared/section-heading";
import { getStudioPulse } from "@/lib/studio-pulse";
import { formatDate } from "@/lib/utils";

export async function StudioPulse() {
  const data = await getStudioPulse();

  return (
    <section className="studio-section">
      <SectionHeading
        eyebrow="动态内容"
        title="Studio Pulse"
        description="我也顺手把 API 接入位预留好了，这里可以承接实时项目动态、外部内容源和自动更新的信息流。"
      />

      {data.source === "github" ? (
        <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="glass-panel rounded-[30px] p-6">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-brand-cyan">
              <Radio className="h-4 w-4" />
              GitHub Live
            </div>
            <h3 className="mt-4 text-3xl font-semibold text-foreground">@{data.username}</h3>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              已接入 GitHub Public API，可以实时展示公开仓库更新、仓库数量和关注数据。
            </p>
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              <div className="rounded-[22px] border border-slate-900/8 bg-slate-900/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">公开仓库</p>
                <p className="mt-2 text-3xl font-semibold text-foreground">{data.stats.repos}</p>
              </div>
              <div className="rounded-[22px] border border-slate-900/8 bg-slate-900/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">关注者</p>
                <p className="mt-2 text-3xl font-semibold text-foreground">{data.stats.followers}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {data.repos.map((repo) => (
              <Link
                key={repo.id}
                href={repo.html_url}
                target="_blank"
                rel="noreferrer"
                className="glass-panel rounded-[26px] p-5 hover:-translate-y-1"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    {repo.language ?? "代码"}
                  </p>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </div>
                <h4 className="mt-4 text-lg font-semibold text-foreground">{repo.name}</h4>
                <p className="mt-3 line-clamp-3 text-sm leading-7 text-muted-foreground">
                  {repo.description ?? "最近更新的公开项目。"}
                </p>
                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Stars {repo.stargazers_count}</span>
                  <span>{formatDate(repo.updated_at)}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
          <div className="glass-panel rounded-[30px] p-6">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-brand-cyan">
              <Sparkles className="h-4 w-4" />
              API Ready
            </div>
            <h3 className="mt-4 text-3xl font-semibold text-foreground">{data.title}</h3>
            <p className="mt-3 text-sm leading-8 text-muted-foreground">{data.description}</p>
            <div className="mt-6 rounded-[22px] border border-dashed border-slate-900/12 bg-slate-900/[0.02] p-4 text-sm leading-7 text-muted-foreground">
              现在只要补一个公开数据源配置，这里就能直接显示实时内容，不需要再改页面结构。
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {data.integrations.map((item) => (
              <div key={item} className="glass-panel rounded-[24px] p-5">
                <Rss className="h-4 w-4 text-brand-violet" />
                <h4 className="mt-4 text-lg font-semibold text-foreground">{item}</h4>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  适合把外部平台内容、动态更新或个人项目数据自动拉进站点里。
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
