import type { Metadata } from "next";
import { PageIntro } from "@/components/shared/page-intro";
import { PageShell } from "@/components/shared/page-shell";
import { Reveal } from "@/components/shared/reveal";
import { SectionHeading } from "@/components/shared/section-heading";
import { stackCategories } from "@/data/site";
import { Cpu, Layers, Terminal, Wrench, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "工具整理",
  description: "整理支撑个人项目、网站开发、内容记录与自动化的常用工具。",
  alternates: { canonical: "/stack" },
};

const categoryIcons = [Terminal, Layers, Cpu, Wrench, Sparkles];

export default function StackPage() {
  const totalTools = stackCategories.reduce((acc, cat) => acc + cat.tools.length, 0);

  return (
    <PageShell>
      <PageIntro>
        {/* 顶部科技感技术栈状态条 */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan text-xs font-mono font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-cyan opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-cyan" />
              </span>
              <span>ENGINEERING STACK // PRODUCTION INFRASTRUCTURE</span>
            </div>

            <div className="hidden sm:flex items-center gap-4 text-xs font-mono text-muted-foreground border border-slate-900/10 rounded-full px-3.5 py-1 bg-white/60 backdrop-blur-xs">
              <span className="flex items-center gap-1.5 text-foreground font-semibold">
                <Cpu className="h-3.5 w-3.5 text-brand-cyan" />
                <span>ACTIVE MODULES: {totalTools} 组核心工具</span>
              </span>
              <span className="text-slate-300">|</span>
              <span className="text-emerald-600 font-semibold">ENV: PRODUCTION VERIFIED</span>
            </div>
          </div>

          <SectionHeading
            level={1}
            eyebrow="生产力工程矩阵 · CORE TOOLING"
            title="工具整理"
            description="支撑全栈系统开发、三维图形渲染、大模型工作流自动化与内容持久化沉淀的核心技术架构清单。"
          />
        </div>

        {/* 技术栈分类网格 */}
        <div className="space-y-8">
          {stackCategories.map((category, index) => {
            const Icon = categoryIcons[index % categoryIcons.length];
            return (
              <Reveal key={category.title} delay={index * 0.05} once>
                <section className="glass-panel rounded-[32px] p-6 sm:p-8 border border-slate-900/10 shadow-[0_8px_30px_rgba(15,23,42,0.03)] relative overflow-hidden bg-white/70 hover:bg-white/90 transition-colors">
                  {/* 分类标题与元信息 */}
                  <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-900/5">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-2xl bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-brand-cyan font-bold">
                            0{index + 1} ·
                          </span>
                          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                            {category.title}
                          </h2>
                        </div>
                        <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                          {category.description}
                        </p>
                      </div>
                    </div>

                    <div className="self-start md:self-auto font-mono text-[11px] px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                      {category.tools.length} 项工具配置
                    </div>
                  </div>

                  {/* 工具卡片列表 */}
                  <div className="grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {category.tools.map((tool, toolIndex) => (
                      <Reveal key={tool.name} delay={toolIndex * 0.02} once>
                        <div className="group flex h-full flex-col justify-between rounded-2xl border border-slate-900/8 bg-white/80 p-5 shadow-xs hover:border-brand-cyan/40 hover:shadow-md hover:shadow-brand-cyan/5 hover:-translate-y-1 transition-all duration-300">
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <p className="text-base font-bold text-foreground group-hover:text-brand-cyan transition-colors">
                                {tool.name}
                              </p>
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 opacity-60 group-hover:opacity-100 group-hover:scale-125 transition-all" />
                            </div>
                            <p className="text-xs leading-relaxed text-muted-foreground">
                              {tool.detail}
                            </p>
                          </div>

                          <div className="mt-4 pt-2 border-t border-slate-900/5 flex items-center justify-between text-[10px] font-mono text-slate-400">
                            <span>VERIFIED</span>
                            <span className="text-brand-cyan opacity-0 group-hover:opacity-100 transition-opacity">
                              ACTIVE STACK
                            </span>
                          </div>
                        </div>
                      </Reveal>
                    ))}
                  </div>
                </section>
              </Reveal>
            );
          })}
        </div>
      </PageIntro>
    </PageShell>
  );
}
