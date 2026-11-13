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
        <SectionHeading
          level={1}
          eyebrow={`INFRASTRUCTURE STACK // ${totalTools} MODULES`}
          title="工具整理 · Production Stack"
          description="支撑全栈系统开发、三维图形渲染、大模型工作流自动化与内容持久化沉淀的核心技术架构清单。"
        />

        <div className="space-y-6">
          {stackCategories.map((category, index) => {
            const Icon = categoryIcons[index % categoryIcons.length];
            return (
              <Reveal key={category.title} delay={index * 0.05} once>
                <section className="arch-frame rounded-xl overflow-hidden">
                  <div className="hud-header">
                    <span className="text-cyan-300">{`STACK_0${index + 1} // ${category.title}`}</span>
                    <span>{category.tools.length} TOOLS</span>
                  </div>

                  <div className="p-5 sm:p-7">
                    <div className="mb-6 flex items-center gap-3 pb-4 border-b border-white/[0.08]">
                      <div className="p-2.5 rounded-lg bg-cyan-950/50 border border-cyan-500/35 text-cyan-300">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-lg sm:text-xl font-bold text-white">{category.title}</h2>
                        <p className="mt-0.5 text-xs sm:text-sm text-slate-400">
                          {category.description}
                        </p>
                      </div>
                    </div>

                    <div className="grid items-stretch gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
                      {category.tools.map((tool) => (
                        <div
                          key={tool.name}
                          className="group flex h-full flex-col justify-between rounded-lg border border-white/10 bg-[#04060b]/85 p-4 hover:border-cyan-400/45 transition-all"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <p className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                                {tool.name}
                              </p>
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            </div>
                            <p className="text-xs leading-relaxed text-slate-400">{tool.detail}</p>
                          </div>

                          <div className="mt-4 pt-2 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono text-slate-500">
                            <span>VERIFIED</span>
                            <span className="text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity">
                              ACTIVE
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
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
