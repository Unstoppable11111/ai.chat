"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  MessageSquare,
  Sparkles,
  Maximize2,
  Minimize2,
  Play,
  Pause,
  FastForward,
  Megaphone,
  Moon,
  Sun,
  Send,
  X,
  Compass,
} from "lucide-react";

interface Agent {
  id: string;
  name: string;
  role: string;
  color: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
  state: "WALKING" | "IDLE" | "TALKING";
  speechBubble: string | null;
  bubbleTimer: number;
  dialogueHistory: string[];
  bio: string;
}

const TOWN_LOCATIONS = [
  { name: "☕ 极客咖啡馆", x: 120, y: 140, w: 100, h: 70, color: "rgba(180, 83, 9, 0.25)" },
  { name: "⚡ 奇点实验室", x: 380, y: 120, w: 110, h: 80, color: "rgba(2, 132, 199, 0.25)" },
  { name: "📈 量化投研所", x: 130, y: 340, w: 100, h: 75, color: "rgba(16, 185, 129, 0.25)" },
  { name: "🛰 卫星雷达站", x: 400, y: 350, w: 100, h: 75, color: "rgba(139, 92, 246, 0.25)" },
  { name: "⛲ 中央喷泉广场", x: 260, y: 240, w: 90, h: 70, color: "rgba(56, 189, 248, 0.2)" },
];

const INITIAL_AGENTS: Agent[] = [
  {
    id: "agent-1",
    name: "爱丽丝 (Alice)",
    role: "多模态 AI 架构师",
    color: "#38bdf8",
    x: 150,
    y: 160,
    targetX: 390,
    targetY: 150,
    speed: 1.2,
    state: "WALKING",
    speechBubble: "正在构思新的视觉 Tokenizer...",
    bubbleTimer: 180,
    dialogueHistory: ["你好呀！我正在测试最新的多模态扩散注意力算法。"],
    bio: "专注大模型多模态架构设计，常年在奇点实验室和咖啡馆之间穿梭。",
  },
  {
    id: "agent-2",
    name: "鲍勃 (Bob)",
    role: "赛博全栈黑客",
    color: "#22c55e",
    x: 280,
    y: 250,
    targetX: 160,
    targetY: 360,
    speed: 1.0,
    state: "WALKING",
    speechBubble: "准备去量化所看看高频行情...",
    bubbleTimer: 200,
    dialogueHistory: ["嘿！刚写完一个自动化渗透探针，打算去喝杯咖啡。"],
    bio: "极客网络安全专家，擅长逆向工程与低延迟网络协议优化。",
  },
  {
    id: "agent-3",
    name: "查理 (Charlie)",
    role: "量化宏观策略师",
    color: "#f59e0b",
    x: 170,
    y: 360,
    targetX: 280,
    targetY: 260,
    speed: 0.9,
    state: "IDLE",
    speechBubble: "多空情绪指标突破了 0.85！",
    bubbleTimer: 220,
    dialogueHistory: ["市场流动性正在向高科技与能源赛道汇聚。"],
    bio: "管理多因子量化交易模型，时刻紧盯全球波动率指数。",
  },
  {
    id: "agent-4",
    name: "黛安娜 (Diana)",
    role: "科幻小说创作者",
    color: "#ec4899",
    x: 420,
    y: 160,
    targetX: 280,
    targetY: 250,
    speed: 1.1,
    state: "WALKING",
    speechBubble: "小说第四幕分镜该怎么收尾呢？",
    bubbleTimer: 190,
    dialogueHistory: ["我正在把小镇发生的真实趣事写进下部赛博科幻短篇里！"],
    bio: "用 AI 辅助分镜脚本创作，善于观察小镇居民的生活与交谈。",
  },
  {
    id: "agent-5",
    name: "伊芙 (Eve)",
    role: "天体轨道侦探",
    color: "#a855f7",
    x: 430,
    y: 370,
    targetX: 150,
    targetY: 160,
    speed: 1.3,
    state: "WALKING",
    speechBubble: "刚才天宫空间站掠过头顶轨道了！",
    bubbleTimer: 210,
    dialogueHistory: ["卫星雷达站接收到了来自深空的微弱遥测信号。"],
    bio: "负责小镇的‘上帝之眼’遥感天线维护与轨道碰撞预警。",
  },
];

export function AITownCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [agents, setAgents] = useState<Agent[]>(INITIAL_AGENTS);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [broadcastText, setBroadcastText] = useState("");
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [simSpeed, setSimSpeed] = useState<1 | 2 | 4>(1);
  const [isPaused, setIsPaused] = useState(false);
  const [isNight, setIsNight] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 玩家角色位置
  const playerRef = useRef({ x: 300, y: 250, targetX: 300, targetY: 250 });
  const animFrameIdRef = useRef<number>(0);

  // 广播小镇大喇叭 (让所有 NPC 产生连锁心声)
  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastText.trim()) return;

    const rumor = broadcastText.trim();
    setAgents((prev) =>
      prev.map((a) => ({
        ...a,
        speechBubble: `📢 听到了大喇叭: "${rumor}"`,
        bubbleTimer: 280,
        dialogueHistory: [...a.dialogueHistory, `【全镇广播】${rumor}`],
      }))
    );
    setBroadcastText("");
    setShowBroadcastModal(false);
  };

  // 与选中的 NPC 私聊
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !selectedAgent) return;

    const userMsg = chatInput.trim();
    const agentReplies = [
      `真有意思！关于“${userMsg}”，我也正好在思考这个课题。`,
      `哈哈，没想到你也关注这个！我赞同你的看法。`,
      `你说的太对了！我得把这个想法记到我的工作流笔记本里。`,
      `原来是这样！难怪刚才小镇广播也在讨论类似的事情。`,
    ];
    const reply = agentReplies[Math.floor(Math.random() * agentReplies.length)];

    const updated = {
      ...selectedAgent,
      speechBubble: reply,
      bubbleTimer: 240,
      dialogueHistory: [...selectedAgent.dialogueHistory, `你: ${userMsg}`, `${selectedAgent.name}: ${reply}`],
    };

    setSelectedAgent(updated);
    setAgents((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    setChatInput("");
  };

  // 主画布渲染与智能体漫游动画循环
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      const container = containerRef.current;
      if (!container || !canvas) return;
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const loop = () => {
      animFrameIdRef.current = requestAnimationFrame(loop);
      const w = canvas.width;
      const h = canvas.height;

      // 1. 绘制小镇地块背景与道路网格
      ctx.fillStyle = isNight ? "#090d16" : "#0d1527";
      ctx.fillRect(0, 0, w, h);

      // 点阵草坪网格
      ctx.fillStyle = isNight ? "rgba(255, 255, 255, 0.03)" : "rgba(56, 189, 248, 0.05)";
      for (let x = 20; x < w; x += 30) {
        for (let y = 20; y < h; y += 30) {
          ctx.beginPath();
          ctx.arc(x, y, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 2. 绘制小镇各个功能建筑区域
      TOWN_LOCATIONS.forEach((loc) => {
        // 建筑地基发光背景
        ctx.fillStyle = loc.color;
        ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(loc.x, loc.y, loc.w, loc.h, 12);
        ctx.fill();
        ctx.stroke();

        // 建筑标题
        ctx.fillStyle = "#e2e8f0";
        ctx.font = "bold 11px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(loc.name, loc.x + loc.w / 2, loc.y + loc.h / 2 + 4);
      });

      // 3. 玩家角色平滑移动
      const player = playerRef.current;
      player.x += (player.targetX - player.x) * 0.1;
      player.y += (player.targetY - player.y) * 0.1;

      // 绘制玩家光环与头像
      ctx.fillStyle = "rgba(0, 240, 255, 0.25)";
      ctx.beginPath();
      ctx.arc(player.x, player.y, 14, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#00f0ff";
      ctx.beginPath();
      ctx.arc(player.x, player.y, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 9px monospace";
      ctx.textAlign = "center";
      ctx.fillText("YOU (玩家)", player.x, player.y - 14);

      if (!isPaused) {
        // 4. 逐智能体更新自主运动与社交邂逅
        setAgents((prevAgents) => {
          return prevAgents.map((agent, idx) => {
            let { x, y, targetX, targetY, speechBubble, bubbleTimer } = agent;

            // 移动插值
            const dx = targetX - x;
            const dy = targetY - y;
            const dist = Math.hypot(dx, dy);

            if (dist > 4) {
              const moveStep = agent.speed * simSpeed;
              x += (dx / dist) * moveStep;
              y += (dy / dist) * moveStep;
            } else {
              // 到达目的地，稍作停留后随机前往另一个建筑
              if (Math.random() < 0.02 * simSpeed) {
                const nextLoc = TOWN_LOCATIONS[Math.floor(Math.random() * TOWN_LOCATIONS.length)];
                targetX = nextLoc.x + Math.random() * (nextLoc.w - 20) + 10;
                targetY = nextLoc.y + Math.random() * (nextLoc.h - 20) + 10;
              }
            }

            // 智能体间相遇八卦社交检测
            for (let j = idx + 1; j < prevAgents.length; j++) {
              const other = prevAgents[j];
              const interDist = Math.hypot(x - other.x, y - other.y);
              if (interDist < 45 && !speechBubble && Math.random() < 0.015) {
                const gossipTopics = [
                  `嗨，${other.name}！今天实验室的新模型跑得怎么样？`,
                  `最近量化投研板块波动好剧烈，你注意到了吗？`,
                  `刚好遇到你！待会儿一起去咖啡馆聊聊吗？`,
                  `天宫空间站好像刚好从我们小镇上空飞过了！`,
                ];
                speechBubble = gossipTopics[Math.floor(Math.random() * gossipTopics.length)];
                bubbleTimer = 200;
              }
            }

            // 气泡倒计时衰减
            if (speechBubble) {
              bubbleTimer -= 1 * simSpeed;
              if (bubbleTimer <= 0) {
                speechBubble = null;
              }
            }

            return {
              ...agent,
              x,
              y,
              targetX,
              targetY,
              speechBubble,
              bubbleTimer,
            };
          });
        });
      }

      // 5. 绘制所有智能体
      agents.forEach((agent) => {
        // 选中高亮光环
        if (selectedAgent?.id === agent.id) {
          ctx.strokeStyle = "#00f0ff";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(agent.x, agent.y, 14, 0, Math.PI * 2);
          ctx.stroke();
        }

        // 角色外发光
        ctx.fillStyle = agent.color;
        ctx.beginPath();
        ctx.arc(agent.x, agent.y, 7, 0, Math.PI * 2);
        ctx.fill();

        // 角色名字标签
        ctx.fillStyle = "#cbd5e1";
        ctx.font = "10px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(agent.name.split(" ")[0], agent.x, agent.y - 12);

        // 心声/交谈对白气泡
        if (agent.speechBubble) {
          const text = agent.speechBubble;
          ctx.font = "10px sans-serif";
          const textW = Math.min(ctx.measureText(text).width + 16, 160);
          const bubbleX = agent.x - textW / 2;
          const bubbleY = agent.y - 38;

          // 气泡圆角矩形
          ctx.fillStyle = "rgba(15, 23, 42, 0.95)";
          ctx.strokeStyle = agent.color;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(bubbleX, bubbleY, textW, 20, 6);
          ctx.fill();
          ctx.stroke();

          // 气泡文字
          ctx.fillStyle = "#ffffff";
          ctx.textAlign = "center";
          ctx.fillText(text.slice(0, 14) + (text.length > 14 ? "..." : ""), agent.x, bubbleY + 14);
        }
      });
    };

    animFrameIdRef.current = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animFrameIdRef.current);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [agents, isPaused, isNight, simSpeed, selectedAgent]);

  // 点击画布：选中智能体 或 移动玩家
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // 检查是否点中了某个智能体
    const clicked = agents.find((a) => Math.hypot(a.x - clickX, a.y - clickY) < 20);
    if (clicked) {
      setSelectedAgent(clicked);
    } else {
      // 移动玩家到目标点
      playerRef.current.targetX = clickX;
      playerRef.current.targetY = clickY;
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full flex flex-col overflow-hidden bg-[#0a0f1d] select-none ${
        isFullscreen ? "fixed inset-0 z-50 h-screen" : "h-[calc(100vh-64px)] min-h-[640px] rounded-2xl border border-slate-800 shadow-2xl"
      }`}
    >
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        className="w-full h-full cursor-pointer"
      />

      {/* 顶部控制与状态栏 */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <Link
            href="/experiments"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700/60 text-slate-200 hover:text-white hover:border-cyan-500/50 text-xs font-medium shadow-lg transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>实验室门户</span>
          </Link>

          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md border border-cyan-500/30 text-cyan-400 text-xs font-mono shadow-lg">
            <Users className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-semibold text-slate-200">AI-TOWN SIM // 智能体小镇</span>
            <span className="text-slate-400">|</span>
            <span>{agents.length} 居民自治</span>
          </div>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          {/* 小镇大喇叭广播 */}
          <button
            type="button"
            onClick={() => setShowBroadcastModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 text-xs shadow-lg transition-all cursor-pointer font-medium"
            title="向全镇发布大喇叭广播，观察 NPC 链式反应"
          >
            <Megaphone className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">大喇叭广播</span>
          </button>

          {/* 仿真倍速切换 */}
          <button
            type="button"
            onClick={() => setSimSpeed(simSpeed === 1 ? 2 : simSpeed === 2 ? 4 : 1)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900/80 border border-slate-700 text-slate-300 text-xs font-mono transition"
            title="调节时间流动速度"
          >
            <FastForward className="w-3 h-3 text-cyan-400" />
            <span>{simSpeed}x</span>
          </button>

          {/* 昼夜交替 */}
          <button
            type="button"
            onClick={() => setIsNight(!isNight)}
            className="p-1.5 rounded-lg bg-slate-900/80 border border-slate-700 text-slate-300 hover:text-white transition"
            title={isNight ? "切换为白昼" : "切换为静谧夜晚"}
          >
            {isNight ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-sky-400" />}
          </button>

          {/* 暂停/继续 */}
          <button
            type="button"
            onClick={() => setIsPaused(!isPaused)}
            className="p-1.5 rounded-lg bg-slate-900/80 border border-slate-700 text-slate-300 hover:text-white transition"
            title={isPaused ? "继续时间流动" : "暂停小镇"}
          >
            {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5 text-slate-400" />}
          </button>

          {/* 全屏 */}
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
            className="p-1.5 rounded-lg bg-slate-900/80 border border-slate-700 text-slate-300 hover:text-white transition"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 底部交互指引小药丸 */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/85 backdrop-blur-md border border-slate-800 text-[11px] font-mono text-slate-400 shadow-xl">
          <Compass className="w-3.5 h-3.5 text-cyan-400" />
          <span>点击地面控制蓝色光标移动 · 点击任意居民展开专属心声对话</span>
        </div>
      </div>

      {/* 选中的智能体对话与详情抽屉 */}
      {selectedAgent && (
        <div className="absolute bottom-16 right-4 z-20 w-80 max-h-[380px] rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-cyan-500/40 p-4 shadow-2xl text-slate-200 flex flex-col space-y-3 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedAgent.color }} />
              <div>
                <span className="text-xs font-bold text-white block">{selectedAgent.name}</span>
                <span className="text-[10px] text-cyan-400 font-mono">{selectedAgent.role}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedAgent(null)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed italic bg-slate-950/60 p-2 rounded-xl border border-slate-800">
            &ldquo;{selectedAgent.bio}&rdquo;
          </p>

          {/* 对话历史记录 */}
          <div className="flex-1 overflow-y-auto space-y-1.5 max-h-[140px] text-xs pr-1 no-scrollbar">
            {selectedAgent.dialogueHistory.map((item, idx) => (
              <div key={idx} className="p-1.5 rounded-lg bg-slate-800/60 text-slate-300 text-[11px]">
                {item}
              </div>
            ))}
          </div>

          {/* 实时聊天输入 */}
          <form onSubmit={handleSendMessage} className="flex items-center gap-1.5 pt-1">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={`和 ${selectedAgent.name.split(" ")[0]} 搭话...`}
              className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-slate-500 outline-none focus:border-cyan-500"
            />
            <button
              type="submit"
              className="p-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* 全镇大喇叭广播弹窗 */}
      {showBroadcastModal && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-5 shadow-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-amber-400" />
                小镇大喇叭广播
              </span>
              <button
                type="button"
                onClick={() => setShowBroadcastModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-400">
              发布一条消息通知，全镇所有 NPC 智能体都将接收并围绕该话题产生连锁对话与心声！
            </p>
            <form onSubmit={handleBroadcast} className="space-y-3">
              <textarea
                value={broadcastText}
                onChange={(e) => setBroadcastText(e.target.value)}
                placeholder="例如：今晚 8 点奇点实验室举行开源黑客松聚会..."
                rows={3}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white outline-none focus:border-amber-400"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition cursor-pointer"
                >
                  立即广播
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
