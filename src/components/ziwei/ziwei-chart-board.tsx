"use client";

import { useState, useMemo } from "react";
import type { ZiweiChart, Palace, Star, SiHua } from "@/lib/ziwei/types";
import { STEMS, BRANCHES, STAR_DESCRIPTIONS, PALACE_NAMES_ORDER } from "@/lib/ziwei/constants";
import { STAR_MASTER_ARCHIVE, BRANCH_ORGAN_MAP } from "@/lib/ziwei/db-analysis";
import {
  getSiHuaByStem,
  getDaXianSiHua,
  getLiuNianSiHua,
  getYearBranchIndex,
} from "@/lib/ziwei/sihua";
import {
  boshiShenName,
  suiQianShenName,
  jiangQianShenName,
} from "@/lib/ziwei/shier-shen";
import {
  Sparkles,
  Compass,
  Clock,
  Calendar,
  X,
  BookOpen,
  Flame,
  Eye,
} from "lucide-react";

/**
 * 传统紫微斗数十二地支在 4×4 网格中的行列坐标（1-indexed）
 * 頂行：巳(5) 午(6) 未(7) 申(8)
 * 二行：辰(4) [中枢]       酉(9)
 * 三行：卯(3) [中枢]       戌(10)
 * 底行：寅(2) 丑(1) 子(0) 亥(11)
 */
const BRANCH_GRID_MAP: Record<
  number,
  { row: number; col: number; cx: number; cy: number; gridClass: string }
> = {
  5:  { row: 1, col: 1, cx: 12.5, cy: 12.5, gridClass: "col-start-1 row-start-1" }, // 巳
  6:  { row: 1, col: 2, cx: 37.5, cy: 12.5, gridClass: "col-start-2 row-start-1" }, // 午
  7:  { row: 1, col: 3, cx: 62.5, cy: 12.5, gridClass: "col-start-3 row-start-1" }, // 未
  8:  { row: 1, col: 4, cx: 87.5, cy: 12.5, gridClass: "col-start-4 row-start-1" }, // 申
  4:  { row: 2, col: 1, cx: 12.5, cy: 37.5, gridClass: "col-start-1 row-start-2" }, // 辰
  9:  { row: 2, col: 4, cx: 87.5, cy: 37.5, gridClass: "col-start-4 row-start-2" }, // 酉
  3:  { row: 3, col: 1, cx: 12.5, cy: 62.5, gridClass: "col-start-1 row-start-3" }, // 卯
  10: { row: 3, col: 4, cx: 87.5, cy: 62.5, gridClass: "col-start-4 row-start-3" }, // 戌
  2:  { row: 4, col: 1, cx: 12.5, cy: 87.5, gridClass: "col-start-1 row-start-4" }, // 寅
  1:  { row: 4, col: 2, cx: 37.5, cy: 87.5, gridClass: "col-start-2 row-start-4" }, // 丑
  0:  { row: 4, col: 3, cx: 62.5, cy: 87.5, gridClass: "col-start-3 row-start-4" }, // 子
  11: { row: 4, col: 4, cx: 87.5, cy: 87.5, gridClass: "col-start-4 row-start-4" }, // 亥
};

const SIHUA_BADGE_STYLE: Record<SiHua, string> = {
  禄: "bg-emerald-600 text-white border-emerald-700",
  权: "bg-amber-600 text-white border-amber-700",
  科: "bg-sky-600 text-white border-sky-700",
  忌: "bg-rose-600 text-white border-rose-700",
};

const BRIGHTNESS_COLOR: Record<string, string> = {
  庙: "text-amber-600 font-bold",
  旺: "text-orange-600 font-bold",
  得: "text-emerald-600 font-semibold",
  利: "text-teal-600",
  平: "text-slate-500",
  不: "text-slate-400",
  闲: "text-slate-400",
  陷: "text-rose-500 font-semibold",
};

interface ZiweiChartBoardProps {
  chart: ZiweiChart;
  selectedBranch: number;
  onSelectBranch: (branch: number) => void;
  onAskPalaceAI: (palace: Palace) => void;
  onAskStarAI: (starName: string, palace: Palace) => void;
}

export function ZiweiChartBoard({
  chart,
  selectedBranch,
  onSelectBranch,
  onAskPalaceAI,
  onAskStarAI,
}: ZiweiChartBoardProps) {
  const [viewMode, setViewMode] = useState<"mingpan" | "daxian" | "liunian">("mingpan");
  const [activeDaXianIdx, setActiveDaXianIdx] = useState<number>(() =>
    chart.currentDaXianIndex >= 0 ? chart.currentDaXianIndex : 0
  );
  const [liunianYear, setLiunianYear] = useState<number>(() => new Date().getFullYear());
  const [inspectingStar, setInspectingStar] = useState<{ star: Star; palace: Palace } | null>(null);

  // 三方四正地支：本宫、对宫 (+6)、三合宫 (+4, +8)
  const sanFangBranches = useMemo(() => {
    const b = ((selectedBranch % 12) + 12) % 12;
    return {
      self: b,
      opposite: (b + 6) % 12,
      triad1: (b + 4) % 12,
      triad2: (b + 8) % 12,
    };
  }, [selectedBranch]);

  // 本命四化
  const natalSiHua = useMemo(() => getSiHuaByStem(chart.lunarInfo.yearStem), [chart.lunarInfo.yearStem]);

  // 大限四化
  const daXianSiHuaInfo = useMemo(() => {
    if (viewMode === "mingpan") return null;
    const idx =
      viewMode === "daxian"
        ? activeDaXianIdx
        : chart.daXians.findIndex((dx) => {
            const age = liunianYear - chart.lunarInfo.lunarYear + 1;
            return age >= dx.startAge && age <= dx.endAge;
          });
    if (idx < 0) return null;
    return getDaXianSiHua(chart, idx, liunianYear);
  }, [chart, viewMode, activeDaXianIdx, liunianYear]);

  // 流年四化与流年命宫地支
  const liuNianInfo = useMemo(() => {
    if (viewMode !== "liunian") return null;
    const sh = getLiuNianSiHua(liunianYear);
    const branch = getYearBranchIndex(liunianYear);
    return { ...sh, branch };
  }, [viewMode, liunianYear]);

  // 运限锚点地支（用于岁前/将前十二神）
  const anchorBranch = useMemo(() => {
    if (viewMode === "liunian" && liuNianInfo) return liuNianInfo.branch;
    if (viewMode === "daxian" && chart.daXians[activeDaXianIdx]) {
      return chart.daXians[activeDaXianIdx].palaceBranch;
    }
    return chart.lunarInfo.yearBranch;
  }, [viewMode, liuNianInfo, chart.daXians, activeDaXianIdx, chart.lunarInfo.yearBranch]);

  // 获取运限叠层宫名（大命/大兄... 或 流命/流兄...）
  const getOverlayPalaceLabel = (palaceBranch: number): { daxian?: string; liunian?: string } => {
    const res: { daxian?: string; liunian?: string } = {};
    if (viewMode === "daxian" || viewMode === "liunian") {
      const dxIdx =
        viewMode === "daxian"
          ? activeDaXianIdx
          : chart.daXians.findIndex((dx) => {
              const age = liunianYear - chart.lunarInfo.lunarYear + 1;
              return age >= dx.startAge && age <= dx.endAge;
            });
      const dx = chart.daXians[dxIdx];
      if (dx) {
        const offset = (dx.palaceBranch - palaceBranch + 12) % 12;
        res.daxian = `大${PALACE_NAMES_ORDER[offset]?.replace("宫", "") || ""}`;
      }
    }
    if (viewMode === "liunian" && liuNianInfo) {
      const offset = (liuNianInfo.branch - palaceBranch + 12) % 12;
      res.liunian = `流${PALACE_NAMES_ORDER[offset]?.replace("宫", "") || ""}`;
    }
    return res;
  };

  const selectedPalace =
    chart.palaces.find((p) => p.branch === selectedBranch) || chart.palaces[0];

  return (
    <div className="space-y-4">
      {/* ─── TimeNav：本命 / 大限 / 流年 运限切换导航栏 ─── */}
      <div className="rounded-2xl border border-amber-900/15 bg-gradient-to-r from-amber-50/90 via-stone-50 to-amber-50/70 p-3.5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 rounded-xl bg-stone-200/70 p-1">
            {(
              [
                { id: "mingpan", label: "本命盘（先天格局）", icon: Compass },
                { id: "daxian", label: "大限盘（十年运限）", icon: Clock },
                { id: "liunian", label: "流年盘（太岁流转）", icon: Calendar },
              ] as const
            ).map((tab) => {
              const Icon = tab.icon;
              const active = viewMode === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setViewMode(tab.id);
                    if (tab.id === "mingpan") {
                      onSelectBranch(chart.mingGongBranch);
                    } else if (tab.id === "daxian") {
                      const targetDx = chart.daXians[activeDaXianIdx];
                      if (targetDx) onSelectBranch(targetDx.palaceBranch);
                    } else if (tab.id === "liunian") {
                      onSelectBranch(getYearBranchIndex(liunianYear));
                    }
                  }}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                    active
                      ? "bg-amber-900 text-amber-50 shadow-xs"
                      : "text-stone-700 hover:bg-stone-300/60"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* 四化图例与快捷跳转 */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-stone-500 font-medium">生年四化：</span>
            {(["禄", "权", "科", "忌"] as SiHua[]).map((sh) => (
              <span
                key={sh}
                className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-0.5 text-[11px] font-medium text-stone-700 border border-stone-200 shadow-2xs"
              >
                <span className={`px-1 rounded text-[10px] font-bold ${SIHUA_BADGE_STYLE[sh]}`}>
                  {sh}
                </span>
                <span>{natalSiHua[sh]}</span>
              </span>
            ))}
          </div>
        </div>

        {/* 大限选择条 */}
        {viewMode === "daxian" && (
          <div className="mt-3 pt-3 border-t border-amber-900/10 flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-amber-900 mr-1">选择十年大限：</span>
            {chart.daXians.map((dx, idx) => {
              const isSelected = idx === activeDaXianIdx;
              const isCurrent = idx === chart.currentDaXianIndex;
              return (
                <button
                  key={`${dx.palaceBranch}-${dx.startAge}`}
                  type="button"
                  onClick={() => {
                    setActiveDaXianIdx(idx);
                    onSelectBranch(dx.palaceBranch);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
                    isSelected
                      ? "bg-amber-800 text-white border-amber-900 shadow-xs font-bold"
                      : isCurrent
                      ? "bg-amber-100/90 text-amber-900 border-amber-400 font-semibold"
                      : "bg-white/80 text-stone-700 border-stone-200 hover:border-amber-400"
                  }`}
                >
                  {dx.startAge}–{dx.endAge}岁 · {dx.palaceName.replace("宫", "")}
                  {isCurrent ? " (当运)" : ""}
                </button>
              );
            })}
            {daXianSiHuaInfo && (
              <div className="ml-auto flex items-center gap-1.5 text-[11px] text-amber-900 bg-amber-100/70 px-2.5 py-1 rounded-lg border border-amber-300/60">
                <span className="font-bold">大限（{daXianSiHuaInfo.stemName}干）四化：</span>
                <span>禄[{daXianSiHuaInfo.transforms["禄"]}]</span>
                <span>权[{daXianSiHuaInfo.transforms["权"]}]</span>
                <span>科[{daXianSiHuaInfo.transforms["科"]}]</span>
                <span>忌[{daXianSiHuaInfo.transforms["忌"]}]</span>
              </div>
            )}
          </div>
        )}

        {/* 流年选择条 */}
        {viewMode === "liunian" && (
          <div className="mt-3 pt-3 border-t border-amber-900/10 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-amber-900">选择流年（太岁）：</span>
              <button
                type="button"
                onClick={() => {
                  const next = liunianYear - 1;
                  setLiunianYear(next);
                  onSelectBranch(getYearBranchIndex(next));
                }}
                className="px-2 py-1 rounded-lg bg-white border border-stone-200 text-xs font-bold text-stone-700 hover:bg-stone-100 cursor-pointer"
              >
                ← 上一年
              </button>
              <select
                value={liunianYear}
                onChange={(e) => {
                  const y = Number(e.target.value);
                  setLiunianYear(y);
                  onSelectBranch(getYearBranchIndex(y));
                }}
                className="rounded-lg border border-amber-400 bg-white px-2.5 py-1 text-xs font-bold text-amber-950"
              >
                {Array.from({ length: 90 }, (_, i) => chart.birthInfo.year + i).map((yr) => {
                  const stem = STEMS[((yr - 4) % 10 + 10) % 10];
                  const branch = BRANCHES[((yr - 4) % 12 + 12) % 12];
                  const nominalAge = yr - chart.lunarInfo.lunarYear + 1;
                  return (
                    <option key={yr} value={yr}>
                      {yr}年（{stem}{branch}年 · 虚岁 {nominalAge} 岁）
                    </option>
                  );
                })}
              </select>
              <button
                type="button"
                onClick={() => {
                  const next = liunianYear + 1;
                  setLiunianYear(next);
                  onSelectBranch(getYearBranchIndex(next));
                }}
                className="px-2 py-1 rounded-lg bg-white border border-stone-200 text-xs font-bold text-stone-700 hover:bg-stone-100 cursor-pointer"
              >
                下一年 →
              </button>
              <button
                type="button"
                onClick={() => {
                  const cur = new Date().getFullYear();
                  setLiunianYear(cur);
                  onSelectBranch(getYearBranchIndex(cur));
                }}
                className="px-2.5 py-1 rounded-lg bg-amber-800 text-white text-xs font-semibold hover:bg-amber-900 cursor-pointer"
              >
                回到今年 ({new Date().getFullYear()})
              </button>
            </div>

            {liuNianInfo && (
              <div className="flex items-center gap-1.5 text-[11px] text-indigo-950 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
                <span className="font-bold">
                  {liunianYear}流年（{liuNianInfo.stemName}
                  {BRANCHES[liuNianInfo.branch]}）四化：
                </span>
                <span>流禄[{liuNianInfo.transforms["禄"]}]</span>
                <span>流权[{liuNianInfo.transforms["权"]}]</span>
                <span>流科[{liuNianInfo.transforms["科"]}]</span>
                <span>流忌[{liuNianInfo.transforms["忌"]}]</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── 传统 4×4 十二宫紫微斗数排盘矩阵 ─── */}
      <div className="relative rounded-3xl border-2 border-amber-900/25 bg-[#fdfbf7] p-2 sm:p-3 shadow-lg overflow-x-auto">
        <div className="relative min-w-[680px] grid grid-cols-4 grid-rows-4 gap-1.5 sm:gap-2">
          {/* SVG 三方四正飞线连接层 */}
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="pointer-events-none absolute inset-0 z-10 h-full w-full"
          >
            <defs>
              <linearGradient id="ziweiLineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#b45309" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#e11d48" stopOpacity="0.45" />
              </linearGradient>
            </defs>
            {(() => {
              const pSelf = BRANCH_GRID_MAP[sanFangBranches.self];
              const pOpp = BRANCH_GRID_MAP[sanFangBranches.opposite];
              const pT1 = BRANCH_GRID_MAP[sanFangBranches.triad1];
              const pT2 = BRANCH_GRID_MAP[sanFangBranches.triad2];
              if (!pSelf || !pOpp || !pT1 || !pT2) return null;
              return (
                <g>
                  {/* 对宫冲照线（虚线） */}
                  <line
                    x1={pSelf.cx}
                    y1={pSelf.cy}
                    x2={pOpp.cx}
                    y2={pOpp.cy}
                    stroke="#e11d48"
                    strokeWidth="0.45"
                    strokeDasharray="1.5 1"
                    strokeOpacity="0.55"
                  />
                  {/* 三合宫连线（三角形实线） */}
                  <polygon
                    points={`${pSelf.cx},${pSelf.cy} ${pT1.cx},${pT1.cy} ${pT2.cx},${pT2.cy}`}
                    fill="rgba(217, 119, 6, 0.03)"
                    stroke="url(#ziweiLineGrad)"
                    strokeWidth="0.38"
                  />
                </g>
              );
            })()}
          </svg>

          {/* 中央天心太极区（占据 2x2） */}
          <div className="col-start-2 col-end-4 row-start-2 row-end-4 z-20 flex flex-col justify-between rounded-2xl border border-amber-900/20 bg-gradient-to-br from-amber-50/95 via-white/95 to-stone-50/95 p-3.5 sm:p-5 shadow-inner">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-900/10 pb-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-amber-900 text-xs font-bold text-amber-50">
                    天纪
                  </span>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-stone-900 flex items-center gap-1.5">
                      <span>{chart.birthInfo.name || "命主"}</span>
                      <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[11px] font-semibold text-amber-900">
                        {chart.yinYangGender || (chart.birthInfo.gender === "male" ? "男命" : "女命")}
                      </span>
                      <span className="rounded-md bg-stone-900 px-1.5 py-0.5 text-[11px] font-semibold text-amber-200">
                        {chart.wuxingJuName}
                      </span>
                    </h3>
                    <p className="text-[11px] text-stone-500">
                      公历 {chart.birthInfo.year}-{String(chart.birthInfo.month).padStart(2, "0")}-
                      {String(chart.birthInfo.day).padStart(2, "0")} · {BRANCHES[chart.birthInfo.hour]}时
                      {chart.birthInfo.city ? ` · ${chart.birthInfo.province || ""}${chart.birthInfo.city}` : ""}
                    </p>
                  </div>
                </div>

                <div className="text-right text-[11px] text-stone-600">
                  <div>
                    命主：<strong className="text-amber-900">{chart.mingZhu || "-"}</strong> · 身主：
                    <strong className="text-amber-900">{chart.shenZhu || "-"}</strong>
                  </div>
                  <div>当前虚岁：{chart.currentAge} 岁</div>
                </div>
              </div>

              {/* 农历与四柱八字 */}
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-stone-100/80 p-2.5 text-xs">
                <div>
                  <span className="text-[10px] text-stone-500 block">农历生辰（正月初一换年）</span>
                  <span className="font-semibold text-stone-800">
                    {STEMS[chart.lunarInfo.yearStem]}
                    {BRANCHES[chart.lunarInfo.yearBranch]}年{" "}
                    {chart.lunarInfo.isLeapMonth ? "闰" : ""}
                    {Math.abs(chart.lunarInfo.lunarMonth)}月{chart.lunarInfo.lunarDay}日
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-500 block">四柱八字（节气干支）</span>
                  <span className="font-mono font-bold text-amber-900">
                    {chart.lunarInfo.fourPillars?.join(" · ") || "-"}
                  </span>
                </div>
              </div>

              {/* 当前选中宫位三方四正速览 */}
              <div className="rounded-xl border border-amber-800/15 bg-amber-50/50 p-2.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-950 flex items-center gap-1">
                    <Eye className="h-3.5 w-3.5 text-amber-700" />
                    当前聚焦：【{selectedPalace.name}】（{STEMS[selectedPalace.stem]}
                    {BRANCHES[selectedPalace.branch]}宫）
                  </span>
                  <span className="text-[10px] text-stone-500">
                    子午流注：{BRANCH_ORGAN_MAP[selectedPalace.branch]?.organ.split("（")[0]}
                  </span>
                </div>
                <p className="text-[11px] text-stone-600 leading-relaxed">
                  三方四正会照：对宫【
                  {chart.palaces.find((p) => p.branch === sanFangBranches.opposite)?.name}】、三合【
                  {chart.palaces.find((p) => p.branch === sanFangBranches.triad1)?.name} ·{" "}
                  {chart.palaces.find((p) => p.branch === sanFangBranches.triad2)?.name}】
                  {selectedPalace.isEmpty && selectedPalace.borrowedStars?.length
                    ? `（本宫无正曜，借对宫${selectedPalace.borrowedStars.join("、")}参看）`
                    : ""}
                </p>
              </div>
            </div>

            {/* 中央底部操作区 */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-amber-900/10">
              <div className="text-[11px] text-stone-500">
                💡 点击任意<strong>宫位</strong>切换三方四正，点击<strong>星曜名称</strong>查阅《天纪》星解
              </div>
              <button
                type="button"
                onClick={() => onAskPalaceAI(selectedPalace)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-800 to-rose-800 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:opacity-95 transition cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>AI 精批【{selectedPalace.name}】</span>
              </button>
            </div>
          </div>

          {/* 十二地支宫位格 */}
          {chart.palaces.map((palace) => {
            const pos = BRANCH_GRID_MAP[palace.branch];
            if (!pos) return null;

            const isSelected = palace.branch === sanFangBranches.self;
            const isOpposite = palace.branch === sanFangBranches.opposite;
            const isTriad =
              palace.branch === sanFangBranches.triad1 ||
              palace.branch === sanFangBranches.triad2;

            const majorStars = palace.stars.filter((s) => s.type === "major");
            const luckyStars = palace.stars.filter((s) => s.type === "lucky");
            const shaStars = palace.stars.filter((s) => s.type === "sha");
            const minorStars = palace.stars.filter((s) => s.type === "minor");

            const overlayLabels = getOverlayPalaceLabel(palace.branch);
            const boshi = boshiShenName(
              chart.lunarInfo.yearStem,
              chart.birthInfo.gender,
              palace.branch
            );
            const suiqian = suiQianShenName(anchorBranch, palace.branch);
            const jiangqian = jiangQianShenName(anchorBranch, palace.branch);

            // 检查大限/流年四化是否落入此宫星曜
            const getStarOverlaySiHua = (starName: string) => {
              const badges: { label: string; cls: string }[] = [];
              if (daXianSiHuaInfo) {
                (["禄", "权", "科", "忌"] as SiHua[]).forEach((sh) => {
                  if (daXianSiHuaInfo.transforms[sh] === starName) {
                    badges.push({
                      label: `大${sh}`,
                      cls: "bg-amber-700 text-white",
                    });
                  }
                });
              }
              if (liuNianInfo) {
                (["禄", "权", "科", "忌"] as SiHua[]).forEach((sh) => {
                  if (liuNianInfo.transforms[sh] === starName) {
                    badges.push({
                      label: `流${sh}`,
                      cls: "bg-indigo-600 text-white",
                    });
                  }
                });
              }
              return badges;
            };

            return (
              <div
                key={palace.branch}
                onClick={() => onSelectBranch(palace.branch)}
                className={`${pos.gridClass} relative z-20 flex min-h-[155px] sm:min-h-[172px] flex-col justify-between rounded-2xl border p-2 sm:p-2.5 transition-all cursor-pointer select-none ${
                  isSelected
                    ? "border-2 border-amber-700 bg-amber-50/95 shadow-md ring-2 ring-amber-500/20"
                    : isOpposite
                    ? "border-rose-400/80 bg-rose-50/40"
                    : isTriad
                    ? "border-amber-400/80 bg-amber-50/35"
                    : "border-stone-200/90 bg-white/95 hover:border-amber-300"
                }`}
              >
                {/* 宫位顶部：主星 + 辅煞星 */}
                <div className="space-y-1">
                  {/* 三方四正角标提示 */}
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex flex-wrap items-center gap-1">
                      {majorStars.length > 0 ? (
                        majorStars.map((star) => {
                          const overBadges = getStarOverlaySiHua(star.name);
                          return (
                            <button
                              key={star.name}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setInspectingStar({ star, palace });
                              }}
                              className="group inline-flex items-center gap-0.5 rounded-md bg-stone-100/90 hover:bg-amber-100 px-1.5 py-0.5 text-xs font-bold text-stone-900 transition cursor-pointer"
                              title={`点击查看【${star.name}】《天纪》详解`}
                            >
                              <span className="text-rose-950 group-hover:text-amber-900">
                                {star.name}
                              </span>
                              {star.brightnessRaw && (
                                <span
                                  className={`text-[10px] ${
                                    BRIGHTNESS_COLOR[star.brightnessRaw] || "text-stone-500"
                                  }`}
                                >
                                  {star.brightnessRaw}
                                </span>
                              )}
                              {star.siHua && (
                                <span
                                  className={`ml-0.5 rounded px-1 text-[10px] font-bold leading-tight ${
                                    SIHUA_BADGE_STYLE[star.siHua]
                                  }`}
                                >
                                  {star.siHua}
                                </span>
                              )}
                              {overBadges.map((b) => (
                                <span
                                  key={b.label}
                                  className={`ml-0.5 rounded px-1 text-[9px] font-bold leading-tight ${b.cls}`}
                                >
                                  {b.label}
                                </span>
                              ))}
                            </button>
                          );
                        })
                      ) : (
                        <span className="text-[11px] italic text-stone-400">
                          空宫（借{palace.borrowedStars?.join("") || "对宫"}）
                        </span>
                      )}
                    </div>

                    {/* 本宫/对宫/三合标签 */}
                    {isSelected && (
                      <span className="shrink-0 rounded bg-amber-800 px-1.5 py-0.5 text-[9px] font-bold text-white">
                        本宫
                      </span>
                    )}
                    {isOpposite && (
                      <span className="shrink-0 rounded bg-rose-600 px-1.5 py-0.5 text-[9px] font-bold text-white">
                        对宫冲照
                      </span>
                    )}
                    {isTriad && (
                      <span className="shrink-0 rounded bg-amber-600 px-1.5 py-0.5 text-[9px] font-bold text-white">
                        三合拱照
                      </span>
                    )}
                  </div>

                  {/* 六吉星与六煞星 */}
                  {(luckyStars.length > 0 || shaStars.length > 0) && (
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {luckyStars.map((star) => {
                        const overBadges = getStarOverlaySiHua(star.name);
                        return (
                          <button
                            key={star.name}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setInspectingStar({ star, palace });
                            }}
                            className="inline-flex items-center gap-0.5 rounded bg-emerald-50 border border-emerald-200/70 px-1 py-0.2 text-[10px] font-semibold text-emerald-800 hover:bg-emerald-100 cursor-pointer"
                          >
                            <span>{star.name}</span>
                            {star.brightnessRaw && (
                              <span className="text-[9px] opacity-75">{star.brightnessRaw}</span>
                            )}
                            {star.siHua && (
                              <span
                                className={`rounded px-0.5 text-[9px] font-bold ${
                                  SIHUA_BADGE_STYLE[star.siHua]
                                }`}
                              >
                                {star.siHua}
                              </span>
                            )}
                            {overBadges.map((b) => (
                              <span
                                key={b.label}
                                className={`rounded px-0.5 text-[8px] font-bold ${b.cls}`}
                              >
                                {b.label}
                              </span>
                            ))}
                          </button>
                        );
                      })}
                      {shaStars.map((star) => (
                        <button
                          key={star.name}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setInspectingStar({ star, palace });
                          }}
                          className="inline-flex items-center gap-0.5 rounded bg-rose-50 border border-rose-200/70 px-1 py-0.2 text-[10px] font-semibold text-rose-700 hover:bg-rose-100 cursor-pointer"
                        >
                          <span>{star.name}</span>
                          {star.brightnessRaw && (
                            <span className="text-[9px] opacity-75">{star.brightnessRaw}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* 杂曜 */}
                  {minorStars.length > 0 && (
                    <div className="flex flex-wrap gap-x-1.5 gap-y-0.5 text-[10px] text-stone-500 leading-tight pt-0.5">
                      {minorStars.slice(0, 8).map((s) => (
                        <span key={s.name}>{s.name}</span>
                      ))}
                    </div>
                  )}
                </div>

                {/* 宫位底部：十二神煞 + 干支 + 宫名 + 大限区间 */}
                <div className="mt-1.5 pt-1.5 border-t border-stone-200/70 space-y-1">
                  {/* 运限叠层标签与十二神 */}
                  <div className="flex items-center justify-between text-[9px] text-stone-400">
                    <span className="truncate">
                      {boshi} · {suiqian} · {jiangqian}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      {overlayLabels.daxian && (
                        <span className="rounded bg-amber-100 px-1 text-[9px] font-bold text-amber-900">
                          {overlayLabels.daxian}
                        </span>
                      )}
                      {overlayLabels.liunian && (
                        <span className="rounded bg-indigo-100 px-1 text-[9px] font-bold text-indigo-800">
                          {overlayLabels.liunian}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 干支、大限岁数、宫位主名称 */}
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-bold text-stone-600">
                      {STEMS[palace.stem]}
                      {BRANCHES[palace.branch]}
                    </span>

                    {palace.daXianAge && (
                      <span
                        className={`text-[10px] font-mono px-1 rounded ${
                          palace.isCurrentDaXian
                            ? "bg-amber-800 text-white font-bold"
                            : "text-stone-500"
                        }`}
                      >
                        {palace.daXianAge[0]}–{palace.daXianAge[1]}
                      </span>
                    )}

                    <div className="flex items-center gap-1">
                      {palace.isShenGong && (
                        <span className="rounded bg-rose-700 px-1 py-0.2 text-[9px] font-bold text-white">
                          身
                        </span>
                      )}
                      <span
                        className={`rounded-md px-1.5 py-0.5 text-xs font-bold ${
                          palace.isMingGong
                            ? "bg-amber-900 text-amber-50"
                            : "bg-stone-100 text-stone-800"
                        }`}
                      >
                        {palace.name}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── 星曜《天纪》详解弹窗 (StarDetailPanel) ─── */}
      {inspectingStar && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
          onClick={() => setInspectingStar(null)}
        >
          <div
            className="relative w-full max-w-lg rounded-3xl border border-amber-900/20 bg-white p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-stone-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-stone-900">
                    【{inspectingStar.star.name}】
                  </span>
                  {inspectingStar.star.brightnessRaw && (
                    <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-900">
                      亮度：{inspectingStar.star.brightnessRaw}
                    </span>
                  )}
                  {inspectingStar.star.siHua && (
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        SIHUA_BADGE_STYLE[inspectingStar.star.siHua]
                      }`}
                    >
                      生年化{inspectingStar.star.siHua}
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-500 mt-1">
                  当前落入：{inspectingStar.palace.name}（
                  {STEMS[inspectingStar.palace.stem]}
                  {BRANCHES[inspectingStar.palace.branch]}宫）
                </p>
              </div>
              <button
                type="button"
                onClick={() => setInspectingStar(null)}
                className="rounded-full p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {STAR_MASTER_ARCHIVE[inspectingStar.star.name] ? (
              <div className="space-y-3 text-xs sm:text-sm text-stone-700 leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-lg bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-800">
                    星系：{STAR_MASTER_ARCHIVE[inspectingStar.star.name].group}
                  </span>
                  <span className="rounded-lg bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-800">
                    五行：{STAR_MASTER_ARCHIVE[inspectingStar.star.name].element}（
                    {STAR_MASTER_ARCHIVE[inspectingStar.star.name].yinYang}）
                  </span>
                  <span className="rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-900">
                    司职：{STAR_MASTER_ARCHIVE[inspectingStar.star.name].role}
                  </span>
                </div>

                <div className="rounded-2xl bg-amber-50/70 border border-amber-200/70 p-3.5 space-y-1.5">
                  <div className="font-bold text-amber-950 flex items-center gap-1.5">
                    <Flame className="h-4 w-4 text-amber-700" />
                    <span>倪海厦《天纪》核心心法</span>
                  </div>
                  <p className="text-stone-800 text-xs leading-relaxed">
                    {STAR_MASTER_ARCHIVE[inspectingStar.star.name].niTeaching}
                  </p>
                </div>

                <div className="rounded-2xl bg-stone-50 border border-stone-200/80 p-3.5 space-y-1.5">
                  <div className="font-bold text-stone-900 flex items-center gap-1.5">
                    <BookOpen className="h-4 w-4 text-stone-700" />
                    <span>古籍原典断语</span>
                  </div>
                  <p className="text-stone-600 text-xs italic">
                    {STAR_MASTER_ARCHIVE[inspectingStar.star.name].classicQuote}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div className="rounded-xl border border-stone-200 p-2.5">
                    <span className="font-bold text-stone-900 block mb-0.5">事业特质：</span>
                    <span className="text-stone-600">
                      {STAR_MASTER_ARCHIVE[inspectingStar.star.name].careerTrait}
                    </span>
                  </div>
                  <div className="rounded-xl border border-stone-200 p-2.5">
                    <span className="font-bold text-stone-900 block mb-0.5">财帛特质：</span>
                    <span className="text-stone-600">
                      {STAR_MASTER_ARCHIVE[inspectingStar.star.name].wealthTrait}
                    </span>
                  </div>
                  <div className="rounded-xl border border-stone-200 p-2.5">
                    <span className="font-bold text-stone-900 block mb-0.5">婚恋情感：</span>
                    <span className="text-stone-600">
                      {STAR_MASTER_ARCHIVE[inspectingStar.star.name].loveTrait}
                    </span>
                  </div>
                  <div className="rounded-xl border border-stone-200 p-2.5">
                    <span className="font-bold text-stone-900 block mb-0.5">中医脏腑关联：</span>
                    <span className="text-stone-600">
                      {STAR_MASTER_ARCHIVE[inspectingStar.star.name].healthOrgan}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-xs text-stone-600">
                <p>
                  <strong>{inspectingStar.star.name}</strong> 为紫微斗数中的重要辅曜/杂曜，当前落入【
                  {inspectingStar.palace.name}】，与本宫主星及三方四正共同作用。
                </p>
                {STAR_DESCRIPTIONS[inspectingStar.star.name] && (
                  <p>
                    关键词：{STAR_DESCRIPTIONS[inspectingStar.star.name].keywords} · 五行：
                    {STAR_DESCRIPTIONS[inspectingStar.star.name].element}
                  </p>
                )}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setInspectingStar(null)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 cursor-pointer"
              >
                关闭
              </button>
              <button
                type="button"
                onClick={() => {
                  const { star, palace } = inspectingStar;
                  setInspectingStar(null);
                  onAskStarAI(star.name, palace);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-900 px-4 py-2 text-xs font-bold text-white hover:bg-amber-800 cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>让 AI 结合本盘精批【{inspectingStar.star.name}】</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
