"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Terminal as TerminalIcon,
  ArrowLeft,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Sparkles,
  ShieldAlert,
  Flame,
  Radio,
  HelpCircle,
} from "lucide-react";

interface NodeTarget {
  id: string;
  ip: string;
  name: string;
  status: "LOCKED" | "PROBED" | "HACKED";
  ports: number[];
  defense: number; // 0 - 100
  bounty: string;
}

const INITIAL_NODES: NodeTarget[] = [
  { id: "NODE-01", ip: "192.168.10.4", name: "荒坂卫星地面中继站", status: "LOCKED", ports: [22, 80], defense: 30, bounty: "获取轨道通信密钥" },
  { id: "NODE-02", ip: "10.0.84.112", name: "康陶量子防御网关", status: "LOCKED", ports: [443, 8080], defense: 65, bounty: "拦截反导防御协议" },
  { id: "NODE-03", ip: "172.16.204.5", name: "军用科技自主AI核心", status: "LOCKED", ports: [9000, 9999], defense: 90, bounty: "提取奇点算法源码" },
];

export function CyberHackTerminal() {
  const [history, setHistory] = useState<Array<{ type: "input" | "output" | "error" | "system" | "matrix"; text: string }>>([
    { type: "system", text: "==========================================================" },
    { type: "system", text: "  CYBERNETICS PENETRATION SUITE // 赛博渗透控制终端 v4.0.8" },
    { type: "system", text: "  CHEN TECH STUDIO // 黑客任务初始化完毕" },
    { type: "system", text: "  输入 'help' 获取所有命令，或点击下方快捷按键快速渗透" },
    { type: "system", text: "==========================================================" },
  ]);

  const [inputVal, setInputVal] = useState("");
  const [nodes, setNodes] = useState<NodeTarget[]>(INITIAL_NODES);
  const [theme, setTheme] = useState<"cyan" | "green" | "amber">("cyan");
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [showMatrix, setShowMatrix] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [traceLevel, setTraceLevel] = useState(0); // 0 - 100 追踪警报
  const [isHackingActive, setIsHackingActive] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const matrixCanvasRef = useRef<HTMLCanvasElement>(null);
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // 极客蜂鸣音效合成器 (Web Audio API，纯计算无音频素材依赖)
  const playBeep = useCallback((freq = 880, duration = 0.05, type: OscillatorType = "sine") => {
    if (!isAudioEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") void ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // 忽略音频限制
    }
  }, [isAudioEnabled]);

  // 终端自动滚动到底部
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  // 数字雨动画
  useEffect(() => {
    if (!showMatrix) return;
    const canvas = matrixCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId = 0;
    const resize = () => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const chars = "0123456789ABCDEFｦｱｳｴｵｶｷｹｺｻｼｽｾｿﾀﾂﾃﾅﾆﾇﾈﾊﾋﾎﾏﾐﾑﾒﾓﾔﾕﾗﾘﾜ";
    const fontSize = 14;
    const columns = Math.floor(canvas.width / fontSize);
    const drops = new Array(columns).fill(1);

    const draw = () => {
      ctx.fillStyle = "rgba(4, 8, 16, 0.08)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = theme === "cyan" ? "#00f0ff" : theme === "green" ? "#22c55e" : "#f59e0b";
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
      animId = requestAnimationFrame(draw);
    };

    animId = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, [showMatrix, theme]);

  // 执行终端命令
  const executeCommand = (cmdStr: string) => {
    const raw = cmdStr.trim();
    if (!raw) return;
    playBeep(620, 0.04, "square");

    const parts = raw.split(/\s+/);
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    const newLogs: Array<{ type: "input" | "output" | "error" | "system" | "matrix"; text: string }> = [
      { type: "input", text: `root@cyberspace:~# ${raw}` },
    ];

    switch (command) {
      case "help":
      case "?":
        newLogs.push(
          { type: "system", text: "--- AVAILABLE COMMANDS (可用渗透指令) ---" },
          { type: "output", text: "  scan          : 深度扫描局域网目标服务器与隐蔽子网" },
          { type: "output", text: "  nodes         : 查看所有扫描到的防御节点情报与状态" },
          { type: "output", text: "  probe <id>    : 探测目标端口漏洞 (例: probe NODE-01)" },
          { type: "output", text: "  nuke <id>     : 发起分布式拒绝服务与缓冲区溢出爆破" },
          { type: "output", text: "  matrix        : 切换后台全息赛博数字雨背景" },
          { type: "output", text: "  trace         : 探测敌方反黑客反向追踪进度" },
          { type: "output", text: "  theme <color> : 切换 CRT 荧光色彩 (cyan / green / amber)" },
          { type: "output", text: "  clear         : 清屏" },
          { type: "system", text: "------------------------------------------------" }
        );
        break;

      case "scan":
        playBeep(980, 0.1, "sawtooth");
        newLogs.push({ type: "system", text: "[*] 正在向子网 192.168.0.0/16 广播 SYN/ACK 隐蔽握手探针..." });
        setTimeout(() => {
          setHistory((prev) => [
            ...prev,
            { type: "output", text: "[+] 发现 3 个在线主机节点! 输入 'nodes' 查看清单与防御矩阵。" },
          ]);
          playBeep(1200, 0.08);
        }, 600);
        break;

      case "nodes":
        newLogs.push({ type: "system", text: "--- TARGET NETWORK NODES (目标节点矩阵) ---" });
        nodes.forEach((n) => {
          newLogs.push({
            type: "output",
            text: `[${n.id}] ${n.ip.padEnd(14)} | ${n.name} | 防御值: ${n.defense}% | 状态: ${n.status}`,
          });
        });
        break;

      case "probe": {
        const targetId = args[0]?.toUpperCase();
        const found = nodes.find((n) => n.id === targetId);
        if (!found) {
          newLogs.push({ type: "error", text: `[-] 找不到指定节点 ID: ${args[0] || "未指定"}。用法: probe NODE-01` });
        } else {
          found.status = "PROBED";
          setNodes([...nodes]);
          playBeep(750, 0.08);
          newLogs.push(
            { type: "system", text: `[*] 正在探测 ${found.id} (${found.ip}) 的开放端口...` },
            { type: "output", text: `[+] 开放端口: [ ${found.ports.join(", ")} ]` },
            { type: "output", text: `[+] 漏洞指纹: CVE-2026-8894 (量子内存越界读取)` },
            { type: "output", text: `[!] 建议攻击: 输入 'nuke ${found.id}' 实施漏洞溢出利用` }
          );
        }
        break;
      }

      case "nuke": {
        const targetId = args[0]?.toUpperCase();
        const found = nodes.find((n) => n.id === targetId);
        if (!found) {
          newLogs.push({ type: "error", text: `[-] 目标不存在: ${args[0] || "未指定"}。用法: nuke NODE-01` });
        } else if (found.status === "HACKED") {
          newLogs.push({ type: "system", text: `[!] 节点 ${found.id} 已经被成功攻陷接管，无需重复渗透。` });
        } else {
          setIsHackingActive(true);
          newLogs.push({ type: "system", text: `[⚡] 发起多线程溢出攻击: ${found.name} (${found.ip})...` });

          // 模拟破解密码滚动
          let count = 0;
          const interval = setInterval(() => {
            count++;
            playBeep(300 + count * 80, 0.03, "triangle");
            if (count >= 5) {
              clearInterval(interval);
              setIsHackingActive(false);
              found.status = "HACKED";
              found.defense = 0;
              setNodes([...nodes]);
              setTraceLevel((prev) => Math.min(100, prev + 25));
              setHistory((h) => [
                ...h,
                { type: "system", text: `[SUCCESS] 破解完成! 获得 root 权限与奖金: ${found.bounty}` },
                { type: "output", text: `[!] 警报: 反向追踪等级上升至 ${Math.min(100, traceLevel + 25)}%!` },
              ]);
            }
          }, 400);
        }
        break;
      }

      case "matrix":
        setShowMatrix((prev) => !prev);
        newLogs.push({ type: "system", text: `[*] 赛博数字雨背景已 ${!showMatrix ? "开启" : "关闭"}` });
        break;

      case "trace":
        newLogs.push(
          { type: "system", text: `[*] 反向网络追踪侦测器: 当前威胁指数 [ ${traceLevel}% ]` },
          { type: "output", text: traceLevel >= 80 ? "[CRITICAL] 敌方网监即将锁定你的真实 IP，建议清理踪迹!" : "[NORMAL] 链路加密层运行良好。" }
        );
        break;

      case "theme": {
        const t = args[0]?.toLowerCase();
        if (t === "cyan" || t === "green" || t === "amber") {
          setTheme(t);
          newLogs.push({ type: "system", text: `[*] 终端 CRT 磷光色彩已切换为: ${t.toUpperCase()}` });
        } else {
          newLogs.push({ type: "error", text: "[-] 无效主题。支持: theme cyan | theme green | theme amber" });
        }
        break;
      }

      case "clear":
        setHistory([]);
        return;

      default:
        newLogs.push({ type: "error", text: `[-] 无法识别的指令: '${command}'。输入 'help' 查看所有可用指令。` });
    }

    setHistory((prev) => [...prev, ...newLogs]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isHackingActive) return;
    executeCommand(inputVal);
    setInputVal("");
  };

  const themeColors = {
    cyan: { text: "text-cyan-400", border: "border-cyan-500/30", bg: "bg-cyan-500/10", shadow: "shadow-cyan-500/20" },
    green: { text: "text-emerald-400", border: "border-emerald-500/30", bg: "bg-emerald-500/10", shadow: "shadow-emerald-500/20" },
    amber: { text: "text-amber-400", border: "border-amber-500/30", bg: "bg-amber-500/10", shadow: "shadow-amber-500/20" },
  }[theme];

  return (
    <div
      ref={containerRef}
      className={`relative w-full flex flex-col overflow-hidden bg-[#040812] font-mono text-xs select-none ${
        isFullscreen ? "fixed inset-0 z-50 h-screen" : "h-[calc(100vh-64px)] min-h-[640px] rounded-2xl border border-slate-800 shadow-2xl"
      }`}
    >
      {/* 赛博数字雨背景 Canvas */}
      {showMatrix && (
        <canvas
          ref={matrixCanvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none opacity-25 z-0"
        />
      )}

      {/* 顶部极客状态与控制栏 */}
      <div className="relative z-10 flex items-center justify-between border-b border-slate-800/80 bg-slate-900/90 px-4 py-2.5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Link
            href="/experiments"
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 hover:text-white text-xs transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">实验室门户</span>
          </Link>

          <div className="flex items-center gap-2">
            <TerminalIcon className={`w-4 h-4 ${themeColors.text}`} />
            <span className="font-bold tracking-wider text-slate-200">CYBER-TERMINAL // HACK-SIM</span>
          </div>

          <div className="hidden md:flex items-center gap-2 text-[11px] px-2.5 py-0.5 rounded-full bg-slate-950 border border-slate-800">
            <ShieldAlert className={`w-3.5 h-3.5 ${traceLevel > 50 ? "text-rose-500 animate-pulse" : "text-emerald-400"}`} />
            <span className="text-slate-400">TRACE:</span>
            <span className={traceLevel > 50 ? "text-rose-400 font-bold" : "text-slate-200"}>{traceLevel}%</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* 主题色彩切换 */}
          <button
            type="button"
            onClick={() => setTheme(theme === "cyan" ? "green" : theme === "green" ? "amber" : "cyan")}
            className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs transition uppercase"
            title="切换 CRT 荧光色彩"
          >
            CRT: {theme}
          </button>

          {/* 音效开关 */}
          <button
            type="button"
            onClick={() => setIsAudioEnabled(!isAudioEnabled)}
            className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition"
            title={isAudioEnabled ? "静音音效" : "开启键盘打字与渗透蜂鸣声"}
          >
            {isAudioEnabled ? <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
          </button>

          {/* 全屏切换 */}
          <button
            type="button"
            onClick={() => {
              if (!containerRef.current) return;
              if (!document.fullscreenElement) {
                void containerRef.current.requestFullscreen();
                setIsFullscreen(true);
              } else {
                void document.exitFullscreen();
                setIsFullscreen(false);
              }
            }}
            className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition"
            title="全屏切换"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 终端主屏幕滚屏输出区域 (CRT 显像管扫描线质感) */}
      <div className="relative z-10 flex-1 overflow-y-auto p-4 space-y-1.5 no-scrollbar">
        {history.map((log, index) => {
          let colorClass = "text-slate-300";
          if (log.type === "input") colorClass = `${themeColors.text} font-bold`;
          if (log.type === "system") colorClass = "text-sky-400";
          if (log.type === "error") colorClass = "text-rose-400 font-semibold";

          return (
            <div key={index} className={`leading-relaxed whitespace-pre-wrap ${colorClass}`}>
              {log.text}
            </div>
          );
        })}
        {isHackingActive && (
          <div className="text-amber-400 animate-pulse font-bold">
            [+] BUFFER OVERFLOW IN PROGRESS... 正在逐字节覆写堆栈指针...
          </div>
        )}
        <div ref={terminalEndRef} />
      </div>

      {/* 快捷命令按键栏 (针对移动端及快速上手) */}
      <div className="relative z-10 px-3 py-1.5 bg-slate-900/80 border-t border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <span className="text-[10px] text-slate-500 font-bold uppercase shrink-0">快捷指令:</span>
        <button
          type="button"
          onClick={() => executeCommand("scan")}
          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs shrink-0 transition"
        >
          🔍 scan (扫描)
        </button>
        <button
          type="button"
          onClick={() => executeCommand("nodes")}
          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs shrink-0 transition"
        >
          🌐 nodes (节点)
        </button>
        <button
          type="button"
          onClick={() => executeCommand("probe NODE-01")}
          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs shrink-0 transition"
        >
          🎯 probe 01 (探测)
        </button>
        <button
          type="button"
          onClick={() => executeCommand("nuke NODE-01")}
          className="px-2.5 py-1 rounded bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs shrink-0 transition"
        >
          ⚡ nuke 01 (渗透)
        </button>
        <button
          type="button"
          onClick={() => executeCommand("matrix")}
          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs shrink-0 transition"
        >
          🌧️ matrix (数字雨)
        </button>
        <button
          type="button"
          onClick={() => executeCommand("help")}
          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs shrink-0 transition"
        >
          ❓ help (帮助)
        </button>
      </div>

      {/* 命令行输入表单 */}
      <form
        onSubmit={handleSubmit}
        className="relative z-10 flex items-center gap-2 border-t border-slate-800 bg-slate-950 px-4 py-2.5"
      >
        <span className={`${themeColors.text} font-bold text-sm shrink-0`}>root@cyberspace:~#</span>
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="输入渗透指令 (输入 help 获取指南)..."
          className="flex-1 bg-transparent text-slate-100 outline-none font-mono text-xs placeholder:text-slate-600"
          autoFocus
          spellCheck={false}
          autoComplete="off"
        />
        <button
          type="submit"
          className={`px-3 py-1 rounded-lg ${themeColors.bg} border ${themeColors.border} ${themeColors.text} text-xs font-semibold hover:brightness-125 transition`}
        >
          EXEC
        </button>
      </form>
    </div>
  );
}
