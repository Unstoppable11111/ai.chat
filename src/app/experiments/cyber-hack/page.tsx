import type { Metadata } from "next";
import { PageShell } from "@/components/shared/page-shell";
import { PageIntro } from "@/components/shared/page-intro";
import { SectionHeading } from "@/components/shared/section-heading";
import { CyberHackTerminal } from "@/components/experiments/cyber-hack-terminal";
import { Terminal, Shield, Cpu, Lock } from "lucide-react";

export const metadata: Metadata = {
  title: "赛博朋克黑客渗透模拟器 · Cyber Hack Simulator",
  description:
    "拟真赛博黑客终端与网络攻防沙盒。包含端口扫描、缓冲区溢出利用、加密哈希解密游戏、全息矩阵数字雨与 CRT 显像管声效反馈。",
  alternates: { canonical: "/experiments/cyber-hack" },
};

export default function CyberHackPage() {
  return (
    <PageShell>
      <PageIntro>
        {/* 顶部军工科幻标签 */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 text-xs font-mono font-medium">
              <Terminal className="w-3.5 h-3.5 text-cyan-600 animate-pulse" />
              <span>TERMINAL OS // DISTRIBUTED EXPLOIT SUITE</span>
            </div>

            <div className="hidden sm:flex items-center gap-4 text-xs font-mono text-muted-foreground border border-slate-900/10 rounded-full px-3.5 py-1 bg-white/60 backdrop-blur-xs">
              <span className="flex items-center gap-1.5 text-foreground font-semibold">
                <Cpu className="h-3.5 w-3.5 text-cyan-600" />
                <span>Web Audio 蜂鸣声效</span>
              </span>
              <span className="text-slate-300">|</span>
              <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                <Shield className="h-3.5 w-3.5 text-emerald-600" />
                <span>反向追踪警报雷达</span>
              </span>
              <span className="text-slate-300">|</span>
              <span className="flex items-center gap-1.5 text-amber-600 font-semibold">
                <Lock className="h-3.5 w-3.5 text-amber-600" />
                <span>缓冲区溢出攻防</span>
              </span>
            </div>
          </div>

          <SectionHeading
            level={1}
            eyebrow="极客黑客模拟 · INTERACTIVE LAB"
            title="赛博朋克黑客渗透模拟器"
            description="基于命令行终端的赛博网络攻防模拟器。输入黑客指令扫描局域网节点、探测开放端口与服务指纹、发动多线程漏洞溢出攻击，伴随 CRT 显像管扫描线与高科技合成蜂鸣声效。"
          />
        </div>

        {/* 核心终端挂载 */}
        <div className="mt-6">
          <CyberHackTerminal />
        </div>
      </PageIntro>
    </PageShell>
  );
}
