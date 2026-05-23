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
        title="项目动态"
        description="这里预留公开项目动态和个人开发记录入口，用于展示网站更新与项目进展。"
      />

      {data.source === "github" ? (
        <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="glass-panel rounded-[30px] p-6">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-brand-cyan">
              <Radio className="h-4 w-4" />
              GitHub 记录
            </div>
            <h3 className="mt-4 text-3xl font-semibold text-foreground">@{data.username}</h3>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              用于展示公开仓库更新、仓库数量和项目维护记录。
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
              数据记录
            </div>
            <h3 className="mt-4 text-3xl font-semibold text-foreground">{data.title}</h3>
            <p className="mt-3 text-sm leading-8 text-muted-foreground">{data.description}</p>
            <div className="mt-6 rounded-[22px] border border-dashed border-slate-900/12 bg-slate-900/[0.02] p-4 text-sm leading-7 text-muted-foreground">
              后续可接入公开项目数据，用来展示更新记录，不涉及用户注册或在线业务功能。
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {data.integrations.map((item) => (
              <div key={item} className="glass-panel rounded-[24px] p-5">
                <Rss className="h-4 w-4 text-brand-violet" />
                <h4 className="mt-4 text-lg font-semibold text-foreground">{item}</h4>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  适合整理公开内容、动态更新或个人项目数据。
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
