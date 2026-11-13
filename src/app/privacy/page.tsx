import type { Metadata } from "next";
import { siteConfig } from "@/data/site";
import { PageShell } from "@/components/shared/page-shell";
import { PageIntro } from "@/components/shared/page-intro";
import { SectionHeading } from "@/components/shared/section-heading";
import { ShieldCheck, Lock, Bot, Clock, Terminal, Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "隐私与数据合规",
  description: "站点账户安全、AI 对话数据边界、会话持久化与数据保护合规声明。",
  alternates: { canonical: "/privacy" },
};

const privacySections = [
  {
    icon: Lock,
    title: "账户与投研数据隔离",
    tag: "ACCOUNT & PORTFOLIO",
    content:
      "注册需要用户名与密码。密码采用强单向加盐摘要（Salted Hash）持久化；登录会话采用 HttpOnly 安全会话凭证，单次最长有效生命周期 8 小时。持仓、模拟策略推演、个人投研报告与已登录对话历史按用户账户严格隔离存储。由站点管理服务维护数据库，数据严格用于本站工作台推演与诊断服务。",
  },
  {
    icon: Bot,
    title: "AI 对话与外部推理边界",
    tag: "AI & MODEL INFERENCE",
    content:
      "当您发送对话消息时，当前对话的上下文记录与 RAG 检索召回的公开站内资料将传送至站内配置的底层模型通道处理。您的私有持仓和个人账户密码绝不会自动附加到 AI 对话流中。模型输出由深度推理生成，回答均提供站内溯源引用链接供您核验原文。",
  },
  {
    icon: Clock,
    title: "历史记录与保存期限",
    tag: "SESSION & RETENTION",
    content:
      "在未登录状态下，AI 对话历史仅保存在当前浏览器的 LocalStorage 中；登录专属账户后，最近 10 个对话历史自动同步保存于服务端，方便跨端回溯。您可在工作台或聊天面板中随时点击“清除对话历史”立即物理抹除记录。",
  },
  {
    icon: Terminal,
    title: "运行记录与限流安全",
    tag: "RATE LIMIT & LOGS",
    content:
      "本站不记录您的完整隐私会话用于第三方商业分析。系统仅维护用于防御高频攻击的短期内存计数器与反滥用限流保护。云基础设施备份遵循最小必要留存规范。",
  },
  {
    icon: Mail,
    title: "数据查阅、更正与注销删除",
    tag: "USER RIGHTS",
    content:
      "您可以在量化工作台与小说工作流中随时编辑、修改或清空自己创建的所有书籍、持仓与资产。若需进行全量账户数据注销或备份清理，可直接通过技术邮箱与我联系。",
  },
];

export default function PrivacyPage() {
  return (
    <PageShell>
      <PageIntro>
        {/* 顶部安全合规雷达 */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-mono font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>DATA GOVERNANCE // ZERO-LEAK COMPLIANCE</span>
            </div>

            <div className="hidden sm:flex items-center gap-4 text-xs font-mono text-muted-foreground border border-slate-900/10 rounded-full px-3.5 py-1 bg-white/60 backdrop-blur-xs">
              <span className="flex items-center gap-1.5 text-foreground font-semibold">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                <span>STORAGE: SALTED HASH ENCRYPTED</span>
              </span>
              <span className="text-slate-300">|</span>
              <span className="text-emerald-600 font-semibold">SESSION: 8H AUTO-EXPIRE</span>
            </div>
          </div>

          <SectionHeading
            level={1}
            eyebrow="数据治理与合规规范 · PRIVACY POLICY"
            title="隐私与数据安全"
            description="关于全站账户体系、端到端数据传输边界、AI 模型推理上下文隔离与数据自决权利的完整规范说明。"
          />
        </div>

        {/* 5 大合规卡片 */}
        <div className="space-y-5">
          {privacySections.map((sec) => {
            const Icon = sec.icon;
            return (
              <section
                key={sec.title}
                className="glass-panel rounded-[28px] p-6 sm:p-7 border border-slate-900/8 bg-white/75 hover:bg-white transition-all shadow-[0_4px_20px_rgba(15,23,42,0.02)]"
              >
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <span className="p-2 rounded-xl bg-slate-100 text-slate-800 border border-slate-200">
                      <Icon className="w-4 h-4 text-brand-cyan" />
                    </span>
                    <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                      {sec.title}
                    </h2>
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                    {sec.tag}
                  </span>
                </div>
                <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground pl-0 sm:pl-11">
                  {sec.content}
                </p>
              </section>
            );
          })}

          {/* 底部联系面板 */}
          <div className="mt-8 rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xl">
            <div className="space-y-1">
              <h3 className="text-lg font-bold">需要协助或数据导出？</h3>
              <p className="text-xs text-slate-300">
                支持申请历史日志导出、私有持仓彻底擦除或注销创作者账号。
              </p>
            </div>
            <a
              href={`mailto:${siteConfig.email}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-slate-950 font-bold text-xs hover:bg-slate-100 transition-colors shrink-0"
            >
              <Mail className="w-3.5 h-3.5 text-brand-cyan" />
              <span>发送技术支持邮件</span>
            </a>
          </div>
        </div>
      </PageIntro>
    </PageShell>
  );
}
