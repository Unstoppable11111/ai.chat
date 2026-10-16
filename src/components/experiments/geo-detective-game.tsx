"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  Trophy,
  Compass,
  RotateCcw,
  Sparkles,
  Search,
  Maximize2,
  ChevronRight,
  HelpCircle,
  Eye,
  CheckCircle2,
} from "lucide-react";

interface RoundData {
  id: number;
  title: string;
  country: string;
  lat: number;
  lng: number;
  sceneImage: string;
  clues: string[];
  trivia: string;
}

const ROUNDS: RoundData[] = [
  {
    id: 1,
    title: "欧陆林荫与铁塔之都",
    country: "法国 · 巴黎 (Paris, France)",
    lat: 48.8584,
    lng: 2.2945,
    sceneImage: "https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?auto=format&fit=crop&w=1600&q=80",
    clues: ["奥斯曼风格弧形灰石建筑", "道路右侧行驶，法文路牌", "塞纳河畔温带悬铃木"],
    trivia: "战神广场（Champ-de-Mars）是巴黎著名的绿地公园，曾作为世博会主会场。",
  },
  {
    id: 2,
    title: "传统町屋与石板巷弄",
    country: "日本 · 京都 (Kyoto, Japan)",
    lat: 35.0037,
    lng: 135.7772,
    sceneImage: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1600&q=80",
    clues: ["全木质町屋建筑与格子窗", "靠左侧行驶，窄巷石板路", "电线杆附带平假名注记"],
    trivia: "京都祇园完好保留了江户时代的传统花街风貌与日式木构聚落。",
  },
  {
    id: 3,
    title: "极光边缘的黑沙苔原",
    country: "冰岛 · 雷克雅未克 (Reykjavik, Iceland)",
    lat: 64.1466,
    lng: -21.9426,
    sceneImage: "https://images.unsplash.com/photo-1504893524553-b855bce32c67?auto=format&fit=crop&w=1600&q=80",
    clues: ["北大西洋寒带火山玄武岩苔原", "无高大乔木，低矮黄色警示桩", "太阳天顶角偏低，长阴影"],
    trivia: "冰岛处于大西洋中脊，全岛覆盖大量火山黑沙滩与地热苔原。",
  },
  {
    id: 4,
    title: "古老巨石与广袤沙原",
    country: "埃及 · 吉萨高地 (Giza, Egypt)",
    lat: 29.9792,
    lng: 31.1342,
    sceneImage: "https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=1600&q=80",
    clues: ["干旱晴空与高反光黄白细沙", "阿拉伯语路碑与石砌巨构", "典型热带沙漠气候特征"],
    trivia: "胡夫金字塔已有超过 4500 年历史，是古代世界七大奇迹中唯一现存的实体。",
  },
  {
    id: 5,
    title: "大江奔流与超高层天际线",
    country: "中国 · 上海陆家嘴 (Shanghai, China)",
    lat: 31.2397,
    lng: 121.4998,
    sceneImage: "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1600&q=80",
    clues: ["宽阔江面与轮渡航道", "现代主义摩天楼矩阵与球体广播电视塔", "中文路标与繁华江堤步道"],
    trivia: "上海陆家嘴黄浦江畔是世界上高层建筑最密集的金融中心之一。",
  },
];

// 计算地球两点间大圆距离 (Haversine Formula)
function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // 地球平均半径 (km)
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// 评分函数 (0 - 5000 分，距离在 20km 内为满分 5000)
function calculateScore(distanceKm: number): number {
  if (distanceKm <= 25) return 5000;
  const score = Math.max(0, Math.round(5000 * Math.exp(-distanceKm / 2200)));
  return score;
}

export function GeoDetectiveGame() {
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [guessPin, setGuessPin] = useState<{ lat: number; lng: number } | null>(null);
  const [roundSubmitted, setRoundSubmitted] = useState(false);
  const [roundScore, setRoundScore] = useState(0);
  const [roundDistance, setRoundDistance] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [showClues, setShowClues] = useState(false);
  const [isMapExpanded, setIsMapExpanded] = useState(false);

  const currentRound = ROUNDS[currentRoundIndex];
  const mapSvgRef = useRef<SVGSVGElement>(null);

  // 点击世界地图插旗 (经纬度线性换算)
  const handleMapClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (roundSubmitted || isGameOver) return;
    const svg = mapSvgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // 换算为经纬度：X (0~width) -> (-180 ~ +180), Y (0~height) -> (+85 ~ -85)
    const lng = Number(((x / rect.width) * 360 - 180).toFixed(4));
    const lat = Number((85 - (y / rect.height) * 170).toFixed(4));

    setGuessPin({ lat, lng });
  };

  // 提交猜测
  const handleSubmitGuess = () => {
    if (!guessPin) return;
    const dist = getDistanceKm(guessPin.lat, guessPin.lng, currentRound.lat, currentRound.lng);
    const score = calculateScore(dist);
    setRoundDistance(dist);
    setRoundScore(score);
    setTotalScore((prev) => prev + score);
    setRoundSubmitted(true);
    setIsMapExpanded(true); // 展开地图展示连线
  };

  // 进入下一轮
  const handleNextRound = () => {
    if (currentRoundIndex + 1 < ROUNDS.length) {
      setCurrentRoundIndex((prev) => prev + 1);
      setGuessPin(null);
      setRoundSubmitted(false);
      setShowClues(false);
      setIsMapExpanded(false);
    } else {
      setIsGameOver(true);
    }
  };

  // 重新开始游戏
  const handleRestart = () => {
    setCurrentRoundIndex(0);
    setGuessPin(null);
    setRoundSubmitted(false);
    setTotalScore(0);
    setIsGameOver(false);
    setShowClues(false);
    setIsMapExpanded(false);
  };

  // 经纬度转 SVG 坐标
  const coordsToSvg = (lat: number, lng: number) => {
    const x = ((lng + 180) / 360) * 800;
    const y = ((85 - lat) / 170) * 450;
    return { x, y };
  };

  return (
    <div className="relative w-full h-[calc(100vh-64px)] min-h-[660px] overflow-hidden bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl flex flex-col select-none">
      {/* 顶部军工战术状态栏 */}
      <div className="relative z-20 flex items-center justify-between border-b border-slate-800/80 bg-slate-900/90 px-4 py-2.5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Link
            href="/experiments"
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">实验室门户</span>
          </Link>

          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-cyan-400" />
            <span className="font-bold tracking-wider text-slate-200">GEO-DETECTIVE // 地理大侦探</span>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs font-mono px-3 py-0.5 rounded-full bg-slate-950 border border-slate-800">
            <span className="text-slate-400">ROUND:</span>
            <span className="text-cyan-400 font-bold">{currentRoundIndex + 1} / {ROUNDS.length}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-mono px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-bold">{totalScore} PTS</span>
          </div>

          <button
            type="button"
            onClick={handleRestart}
            className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition"
            title="重新开始游戏"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 核心街景照片探索视窗 */}
      <div className="relative flex-1 bg-black overflow-hidden group">
        <div
          className="w-full h-full bg-cover bg-center transition-transform duration-700 ease-out"
          style={{ backgroundImage: `url(${currentRound.sceneImage})` }}
        />

        {/* 顶部场景线索提示胶囊 */}
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => setShowClues(!showClues)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/85 backdrop-blur-md border border-cyan-500/40 text-cyan-300 hover:bg-slate-900 text-xs font-medium shadow-xl transition cursor-pointer self-start"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{showClues ? "收起线索" : "查看环境侦探线索"}</span>
          </button>

          {showClues && (
            <div className="p-3 rounded-2xl bg-slate-900/95 backdrop-blur-md border border-slate-700 text-xs text-slate-300 max-w-xs space-y-1.5 animate-in fade-in slide-in-from-top-1 shadow-2xl">
              <span className="font-bold text-white text-[11px] block border-b border-slate-800 pb-1">
                🔍 侦探线索簿：
              </span>
              {currentRound.clues.map((c, i) => (
                <div key={i} className="flex items-start gap-1.5 text-[11px]">
                  <span className="text-cyan-400 font-mono">•</span>
                  <span>{c}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 右下角交互地图插旗视窗 */}
        <div
          className={`absolute bottom-4 right-4 z-20 rounded-2xl border-2 border-cyan-500/50 bg-slate-950/95 backdrop-blur-xl shadow-2xl transition-all duration-300 flex flex-col overflow-hidden ${
            isMapExpanded ? "w-[92vw] sm:w-[540px] h-[340px]" : "w-64 sm:w-80 h-44 hover:w-72 sm:hover:w-96 hover:h-52"
          }`}
        >
          <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-800 text-[11px] font-mono text-slate-300">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-cyan-400" />
              <span>{roundSubmitted ? "猜测对比结算" : "点击地图标定你的猜测点"}</span>
            </span>
            <button
              type="button"
              onClick={() => setIsMapExpanded(!isMapExpanded)}
              className="text-slate-400 hover:text-white"
            >
              <Maximize2 className="w-3 h-3" />
            </button>
          </div>

          {/* SVG 简化世界经纬度地图 */}
          <div className="relative flex-1 bg-slate-900/80 cursor-crosshair">
            <svg
              ref={mapSvgRef}
              onClick={handleMapClick}
              viewBox="0 0 800 450"
              className="w-full h-full"
            >
              {/* 经纬度网格线 */}
              <defs>
                <pattern id="grid" width="80" height="45" patternUnits="userSpaceOnUse">
                  <path d="M 80 0 L 0 0 0 45" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.8" />
                </pattern>
              </defs>
              <rect width="800" height="450" fill="url(#grid)" />

              {/* 赤道与本初子午线高亮 */}
              <line x1="0" y1="225" x2="800" y2="225" stroke="rgba(56, 189, 248, 0.2)" strokeDasharray="3 3" />
              <line x1="400" y1="0" x2="400" y2="450" stroke="rgba(56, 189, 248, 0.2)" strokeDasharray="3 3" />

              {/* 玩家猜测插旗点 */}
              {guessPin && (
                <g>
                  {(() => {
                    const pos = coordsToSvg(guessPin.lat, guessPin.lng);
                    return (
                      <>
                        <circle cx={pos.x} cy={pos.y} r="6" fill="#00f0ff" opacity="0.3" className="animate-ping" />
                        <circle cx={pos.x} cy={pos.y} r="4" fill="#00f0ff" stroke="#ffffff" strokeWidth="1.5" />
                      </>
                    );
                  })()}
                </g>
              )}

              {/* 结算时展示真实坐标点与两点连线 */}
              {roundSubmitted && (
                <g>
                  {(() => {
                    if (!guessPin) return null;
                    const p1 = coordsToSvg(guessPin.lat, guessPin.lng);
                    const p2 = coordsToSvg(currentRound.lat, currentRound.lng);
                    return (
                      <>
                        {/* 连线 */}
                        <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#22c55e" strokeWidth="2" strokeDasharray="4 2" />
                        {/* 真实目标点 (绿色) */}
                        <circle cx={p2.x} cy={p2.y} r="8" fill="#22c55e" opacity="0.4" />
                        <circle cx={p2.x} cy={p2.y} r="5" fill="#22c55e" stroke="#ffffff" strokeWidth="1.5" />
                      </>
                    );
                  })()}
                </g>
              )}
            </svg>
          </div>

          {/* 底部操作与得分栏 */}
          <div className="p-2 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-2">
            {!roundSubmitted ? (
              <>
                <span className="text-[10px] text-slate-400 font-mono truncate">
                  {guessPin ? `标定: ${guessPin.lat}°N, ${guessPin.lng}°E` : "在地图上点击插旗"}
                </span>
                <button
                  type="button"
                  disabled={!guessPin}
                  onClick={handleSubmitGuess}
                  className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:hover:bg-cyan-500 text-slate-950 font-bold text-xs transition cursor-pointer shrink-0"
                >
                  确认猜测 (GUESS)
                </button>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="text-emerald-400 font-bold">+{roundScore} 分</span>
                  <span className="text-slate-500">|</span>
                  <span className="text-slate-300">相距 {roundDistance.toLocaleString()} km</span>
                </div>
                <button
                  type="button"
                  onClick={handleNextRound}
                  className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <span>下一轮</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 结算本轮真相揭晓浮层 */}
      {roundSubmitted && (
        <div className="absolute top-16 right-4 z-30 max-w-sm rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-emerald-500/50 p-4 shadow-2xl text-slate-200 space-y-2 animate-in fade-in slide-in-from-right-2">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
            <CheckCircle2 className="w-4 h-4" />
            <span>真凶揭晓：{currentRound.country}</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {currentRound.trivia}
          </p>
        </div>
      )}

      {/* 最终通关结算大模态框 */}
      {isGameOver && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-cyan-500/50 p-6 shadow-2xl text-center space-y-4 animate-in zoom-in-95">
            <div className="w-14 h-14 mx-auto rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-xl">
              <Trophy className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">探案报告出炉 · 恭喜通关！</h2>
              <p className="text-xs text-slate-400 mt-1">
                你成功完成了全部 5 处全球街景的蛛丝马迹勘查。
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-2xl font-mono font-bold text-cyan-400">
              {totalScore} / 25,000 PTS
            </div>

            <p className="text-xs text-slate-300">
              {totalScore > 20000
                ? "🏅 称号：全球顶级地理特工！你的空间敏感度与环境观察力无可匹敌。"
                : totalScore > 12000
                ? "🥈 称号：资深环球旅行家！掌握了各大洲丰富的人文与植被特征。"
                : "🥉 称号：初级见习侦探！继续在街景中磨砺你的辨别眼力吧。"}
            </p>

            <button
              type="button"
              onClick={handleRestart}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs shadow-lg hover:brightness-110 transition cursor-pointer"
            >
              再次挑战
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
