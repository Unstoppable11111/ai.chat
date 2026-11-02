"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useAuth } from "@/components/auth/auth-provider";
import {
  generateChart,
  setBrightnessSchool,
  type SchoolBrightnessKind,
} from "@/lib/ziwei/algorithm";
import type { LeapMonth } from "@/lib/ziwei/school-config";
import type { BirthFormState, Palace, ZiweiChart } from "@/lib/ziwei/types";
import { SHICHEN, BRANCHES, STEMS } from "@/lib/ziwei/constants";
import { PROVINCES } from "@/lib/ziwei/cities";
import { calculateTrueSolarTime } from "@/lib/ziwei/true-solar-time";
import { isChinaDST, chinaDSTRange } from "@/lib/ziwei/dst-cn";
import { shiftClock } from "@/lib/ziwei/clock-adjust";
import { FAMOUS_PERSONS, type FamousPerson } from "@/lib/ziwei/famous";
import { useHistory } from "@/lib/ziwei/history";
import {
  formToBirthInfo,
  formToSearchParams,
  searchParamsToForm,
} from "@/lib/ziwei/share";
import { detectPatterns } from "@/lib/ziwei/patterns";
import {
  generate13DimensionAnalysis,
  computeLocalHemingMatch,
  ALL_TOPICS,
  TOPIC_LABEL,
  type TopicKey,
} from "@/lib/ziwei/db-analysis";
import { ZiweiChartBoard } from "@/components/ziwei/ziwei-chart-board";
import {
  ZiweiKnowledgeView,
  ZiweiClassicsLibraryView,
  ZiweiSanjiSchoolView,
} from "@/components/ziwei/ziwei-knowledge-library";
import {
  Sparkles,
  Compass,
  HeartHandshake,
  BookOpen,
  ScrollText,
  GraduationCap,
  MapPin,
  Clock,
  Share2,
  History,
  Settings2,
  UserCheck,
  Send,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Award,
  Trash2,
  RotateCcw,
} from "lucide-react";

type MainTab = "chart" | "heming" | "knowledge" | "library" | "sanji";
type AnalysisSubTab = "ai" | "dimensions" | "patterns";
type ChatMsg = { role: "user" | "assistant"; content: string };

interface QuotaState {
  authenticated: boolean;
  unlimited: boolean;
  total: number;
  remaining: number;
}

const DEFAULT_FORM_A: BirthFormState = {
  name: "陈先生",
  year: "1994",
  month: "6",
  day: "18",
  clockHour: "10",
  clockMinute: "30",
  unknownTime: false,
  province: "上海市",
  city: "上海",
  longitude: 121.5,
  gender: "male",
};

const DEFAULT_FORM_B: BirthFormState = {
  name: "林女士",
  year: "1996",
  month: "9",
  day: "22",
  clockHour: "14",
  clockMinute: "15",
  unknownTime: false,
  province: "浙江省",
  city: "杭州",
  longitude: 120.2,
  gender: "female",
};

const QUICK_AI_TOPICS = [
  {
    label: "🔮 命格全景总批",
    prompt:
      "请按倪海厦《天纪》体系，结合我的命宫、身宫、三方四正（财帛、官禄、迁移）及生年四化，为我做一份深度的命格全景总批，并指出我一生的核心优势与最需防范的功课。",
  },
  {
    label: "❤️ 感情与正缘婚期",
    prompt:
      "请严格按照倪师「看婚姻必同时参看夫妻宫与福德宫」的法则，详细分析我的配偶性格特征、感情相处模式、早婚/晚婚建议，以及需要注意的婚恋隐患。",
  },
  {
    label: "💼 事业赛道与官禄",
    prompt:
      "请结合我的官禄宫、命宫与财帛宫三方四正，分析我最适合从事的行业赛道、适合体制内/大厂做高管还是独立创业合伙，以及未来十年的事业关键发力点。",
  },
  {
    label: "💰 财帛格局与田宅财库",
    prompt:
      "请结合我的财帛宫、福德宫（对宫）与田宅宫（藏财之库），深度解读我的正偏财运势、赚钱模式、守财能力以及不动产置业建议。",
  },
  {
    label: "🩺 子午流注与疾厄养生",
    prompt:
      "请按倪海厦老师《天纪》结合中医子午流注（十二地支对应十二经络脏腑）的方法，分析我疾厄宫及全盘煞忌最集中的地支脏腑，给出具体的日常作息与养生调理建议。",
  },
  {
    label: "🧭 2026流年运势精批",
    prompt:
      "请结合我当前所行的大限与 2026 丙午流年（太岁在午宫，丙干天同化禄、天机化权、文昌化科、廉贞化忌），详细推演我今年的事业、财运、感情与健康吉凶及趋吉避凶建议。",
  },
];

function parseSSEChunk(
  buffer: string,
  onDelta: (text: string) => void,
  onQuota?: (q: { remaining: number; unlimited: boolean; total: number }) => void
): string {
  const parts = buffer.split("\n\n");
  const rest = parts.pop() || "";

  for (const block of parts) {
    const lines = block.split("\n");
    let eventName = "message";
    for (const line of lines) {
      if (line.startsWith("event:")) {
        eventName = line.slice(6).trim();
      } else if (line.startsWith("data:")) {
        const raw = line.slice(5).trim();
        if (!raw || raw === "[DONE]") continue;
        try {
          const parsed = JSON.parse(raw);
          if (eventName === "quota" && onQuota) {
            onQuota(parsed);
          } else if (parsed.choices?.[0]?.delta?.content) {
            onDelta(parsed.choices[0].delta.content);
          } else if (parsed.message && eventName === "error") {
            onDelta(`\n\n⚠️ ${parsed.message}`);
          }
        } catch {
          // ignore partial JSON
        }
      }
    }
  }
  return rest;
}

export function ZiweiStudio() {
  const { isAuthenticated, openAuthModal } = useAuth();
  const { history, save: saveHistory, remove: removeHistory, clear: clearHistory } = useHistory();

  // 顶层工作台 Tab
  const [mainTab, setMainTab] = useState<MainTab>("chart");

  // 排盘表单状态（支持从 URL 分享参数初始化）
  const [formA, setFormA] = useState<BirthFormState>(() => {
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      const fromUrl = searchParamsToForm(sp);
      if (fromUrl) return { ...DEFAULT_FORM_A, ...fromUrl };
    }
    return DEFAULT_FORM_A;
  });
  const [shichenBranchA, setShichenBranchA] = useState<number>(5); // 未知分钟时直接选时辰
  const [dstAdjustedA, setDstAdjustedA] = useState<boolean>(false);

  // 流派配置
  const [brightnessSchool, setBrightnessSchoolState] = useState<SchoolBrightnessKind>("default");
  const [leapPolicy, setLeapPolicy] = useState<LeapMonth>("split");
  const [showSchoolDrawer, setShowSchoolDrawer] = useState<boolean>(false);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState<boolean>(false);
  const [shareCopied, setShareCopied] = useState<boolean>(false);

  // 盘面选中地支 & 分析子面板 Tab
  const [selectedBranch, setSelectedBranch] = useState<number>(0);
  const [analysisTab, setAnalysisTab] = useState<AnalysisSubTab>("ai");
  const [activeDimTopic, setActiveDimTopic] = useState<TopicKey>("overview");

  // AI 批断对话状态（单人命盘）
  const [aiMessages, setAiMessages] = useState<ChatMsg[]>([]);
  const [aiInput, setAiInput] = useState<string>("");
  const [aiStreaming, setAiStreaming] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // 双人合盘状态
  const [formB, setFormB] = useState<BirthFormState>(DEFAULT_FORM_B);
  const [hemingMessages, setHemingMessages] = useState<ChatMsg[]>([]);
  const [hemingInput, setHemingInput] = useState<string>("");
  const [hemingStreaming, setHemingStreaming] = useState<boolean>(false);
  const [hemingError, setHemingError] = useState<string | null>(null);

  // 游客免费 3 次 AI 额度状态
  const [quota, setQuota] = useState<QuotaState>({
    authenticated: false,
    unlimited: false,
    total: 3,
    remaining: 3,
  });

  // 异步拉取 AI 额度状态（严格遵循 React 19 规范，不在 useEffect 同步直接调 setState）
  useEffect(() => {
    let active = true;
    const loadQuota = async () => {
      try {
        const res = await fetch("/api-ziwei", { cache: "no-store" });
        if (!res.ok || !active) return;
        const data = await res.json();
        if (!active) return;
        setQuota({
          authenticated: Boolean(data.authenticated),
          unlimited: Boolean(data.unlimited),
          total: typeof data.total === "number" ? data.total : 3,
          remaining: typeof data.remaining === "number" ? data.remaining : 3,
        });
      } catch {
        // ignore network error
      }
    };
    void loadQuota();

    const onAuthChanged = () => {
      void loadQuota();
    };
    window.addEventListener("auth-state-changed", onAuthChanged);
    return () => {
      active = false;
      window.removeEventListener("auth-state-changed", onAuthChanged);
    };
  }, [isAuthenticated]);

  // 计算真太阳时校正详情（甲方）
  const solarTimeDetailA = useMemo(() => {
    const y = parseInt(formA.year) || 1994;
    const m = parseInt(formA.month) || 6;
    const d = parseInt(formA.day) || 18;
    const h = parseInt(formA.clockHour) || 0;
    const min = parseInt(formA.clockMinute) || 0;
    return calculateTrueSolarTime({
      year: y,
      month: m,
      day: d,
      clockHour: h,
      clockMinute: min,
      longitude: formA.province ? formA.longitude : undefined,
    });
  }, [formA]);

  // 检测中国大陆夏令时（1986–1991 等）
  const dstInfoA = useMemo(() => {
    const y = parseInt(formA.year) || 0;
    const m = parseInt(formA.month) || 0;
    const d = parseInt(formA.day) || 0;
    const active = isChinaDST(y, m, d);
    const range = chinaDSTRange(y);
    return { active, range, year: y };
  }, [formA.year, formA.month, formA.day]);

  // 生成甲方命盘
  const chartAResult = useMemo<{ chart: ZiweiChart | null; error: string | null }>(() => {
    try {
      setBrightnessSchool(brightnessSchool);
      const baseInfo = formToBirthInfo(formA);
      if (formA.unknownTime) {
        baseInfo.hour = shichenBranchA;
      }
      const c = generateChart(baseInfo, { leapMonth: leapPolicy });
      return { chart: c, error: null };
    } catch (e) {
      return {
        chart: null,
        error: e instanceof Error ? e.message : "出生日期无效，请检查公历年月日是否正确（如平年无2月29日）",
      };
    }
  }, [formA, shichenBranchA, brightnessSchool, leapPolicy]);

  // 生成乙方命盘（供双人合盘使用）
  const chartBResult = useMemo<{ chart: ZiweiChart | null; error: string | null }>(() => {
    try {
      setBrightnessSchool(brightnessSchool);
      const baseInfo = formToBirthInfo(formB);
      const c = generateChart(baseInfo, { leapMonth: leapPolicy });
      return { chart: c, error: null };
    } catch (e) {
      return {
        chart: null,
        error: e instanceof Error ? e.message : "乙方出生日期无效，请检查公历年月日",
      };
    }
  }, [formB, brightnessSchool, leapPolicy]);

  const chart = chartAResult.chart;
  const chartB = chartBResult.chart;

  // 13 维确定性断语与格局识别
  const dimensions13 = useMemo(() => (chart ? generate13DimensionAnalysis(chart) : null), [chart]);
  const patternsList = useMemo(() => (chart ? detectPatterns(chart) : []), [chart]);
  const localHeming = useMemo(
    () => (chart && chartB ? computeLocalHemingMatch(chart, chartB) : null),
    [chart, chartB]
  );

  // 发送单人命盘 AI 批断请求
  const sendInterpretQuestion = useCallback(
    async (questionText: string) => {
      if (!chart || !questionText.trim() || aiStreaming) return;

      // 前端前置检查：未登录且剩余 0 次时直接唤起登录框
      if (!isAuthenticated && !quota.unlimited && quota.remaining <= 0) {
        setAiError("您的 3 次游客免费 AI 命理批断额度已用完，请登录账号后解锁无限次解读！");
        openAuthModal("login");
        return;
      }

      setAiError(null);
      setAnalysisTab("ai");
      const nextMessages: ChatMsg[] = [
        ...aiMessages,
        { role: "user", content: questionText.trim() },
      ];
      setAiMessages([...nextMessages, { role: "assistant", content: "" }]);
      setAiInput("");
      setAiStreaming(true);

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch("/api-ziwei", {
          method: "POST",
          signal: controller.signal,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "interpret",
            chart,
            messages: nextMessages,
          }),
        });

        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          setAiMessages(nextMessages);
          if (res.status === 401 || errJson.requireLogin) {
            setQuota((prev) => ({ ...prev, remaining: 0 }));
            setAiError(
              errJson.text ||
                "您的 3 次游客免费 AI 批断额度已用尽，请登录账号后继续无限次使用！"
            );
            openAuthModal("login");
          } else {
            setAiError(errJson.text || "AI 命理服务暂时繁忙，请稍后重试");
          }
          setAiStreaming(false);
          return;
        }

        const remHeader = res.headers.get("X-Ziwei-Remaining");
        if (remHeader !== null) {
          const num = Number(remHeader);
          if (Number.isFinite(num) && num >= 0) {
            setQuota((prev) => ({ ...prev, remaining: num }));
          }
        }

        const reader = res.body?.getReader();
        if (!reader) {
          setAiStreaming(false);
          return;
        }

        const decoder = new TextDecoder();
        let buffer = "";
        let acc = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          buffer = parseSSEChunk(
            buffer,
            (delta) => {
              acc += delta;
              setAiMessages([
                ...nextMessages,
                { role: "assistant", content: acc },
              ]);
            },
            (q) => {
              setQuota((prev) => ({
                ...prev,
                remaining: q.remaining,
                unlimited: q.unlimited,
                total: q.total,
              }));
            }
          );
        }
      } catch (e) {
        if ((e as Error)?.name !== "AbortError") {
          setAiError("网络连接中断，请稍后重试");
        }
      } finally {
        setAiStreaming(false);
      }
    },
    [chart, aiStreaming, isAuthenticated, quota, aiMessages, openAuthModal]
  );

  // 发送双人合盘 AI 批断请求
  const sendHemingQuestion = useCallback(
    async (questionText: string) => {
      if (!chart || !chartB || !questionText.trim() || hemingStreaming) return;

      if (!isAuthenticated && !quota.unlimited && quota.remaining <= 0) {
        setHemingError("您的 3 次游客免费 AI 合盘额度已用完，请登录账号后解锁无限次合盘！");
        openAuthModal("login");
        return;
      }

      setHemingError(null);
      const nextMessages: ChatMsg[] = [
        ...hemingMessages,
        { role: "user", content: questionText.trim() },
      ];
      setHemingMessages([...nextMessages, { role: "assistant", content: "" }]);
      setHemingInput("");
      setHemingStreaming(true);

      try {
        const res = await fetch("/api-ziwei", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "heming",
            chartA: chart,
            chartB: chartB,
            messages: nextMessages,
          }),
        });

        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          setHemingMessages(nextMessages);
          if (res.status === 401 || errJson.requireLogin) {
            setQuota((prev) => ({ ...prev, remaining: 0 }));
            setHemingError(
              errJson.text ||
                "您的 3 次游客免费 AI 额度已用尽，请登录账号后解锁无限次双人合盘！"
            );
            openAuthModal("login");
          } else {
            setHemingError(errJson.text || "AI 合盘服务暂时繁忙，请稍后重试");
          }
          setHemingStreaming(false);
          return;
        }

        const reader = res.body?.getReader();
        if (!reader) {
          setHemingStreaming(false);
          return;
        }

        const decoder = new TextDecoder();
        let buffer = "";
        let acc = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          buffer = parseSSEChunk(
            buffer,
            (delta) => {
              acc += delta;
              setHemingMessages([
                ...nextMessages,
                { role: "assistant", content: acc },
              ]);
            },
            (q) => {
              setQuota((prev) => ({
                ...prev,
                remaining: q.remaining,
                unlimited: q.unlimited,
                total: q.total,
              }));
            }
          );
        }
      } catch {
        setHemingError("合盘流传输中断，请重试");
      } finally {
        setHemingStreaming(false);
      }
    },
    [chart, chartB, hemingStreaming, isAuthenticated, quota, hemingMessages, openAuthModal]
  );

  // 载入名人案例
  const applyFamousPerson = (fp: FamousPerson) => {
    const newForm: BirthFormState = {
      name: fp.name,
      year: String(fp.year),
      month: String(fp.month),
      day: String(fp.day),
      clockHour: String(fp.hour * 2),
      clockMinute: "0",
      unknownTime: true,
      province: "",
      city: "",
      longitude: 120,
      gender: fp.gender,
    };
    setFormA(newForm);
    setShichenBranchA(fp.hour);
    setDstAdjustedA(false);
    setAiMessages([]);
  };

  // 复制分享链接
  const handleCopyShareUrl = () => {
    if (typeof window === "undefined") return;
    const sp = formToSearchParams(formA);
    const url = `${window.location.origin}${window.location.pathname}?${sp.toString()}`;
    navigator.clipboard.writeText(url).catch(() => {});
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* ─── 顶层五大模块导航栏 + AI 额度状态徽章 ─── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 rounded-3xl border border-amber-900/20 bg-gradient-to-r from-stone-900 via-amber-950 to-stone-900 p-4 sm:p-5 text-white shadow-lg">
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { id: "chart", label: "紫微排盘工作台", icon: Compass },
              { id: "heming", label: "双人合盘姻缘", icon: HeartHandshake },
              { id: "knowledge", label: "十四主星百科", icon: BookOpen },
              { id: "library", label: "三大古籍原典", icon: ScrollText },
              { id: "sanji", label: "倪海厦三纪学堂", icon: GraduationCap },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const active = mainTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setMainTab(tab.id)}
                className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  active
                    ? "bg-amber-400 text-stone-950 shadow-md scale-[1.02]"
                    : "text-stone-200 hover:bg-white/10"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* 右侧：AI 免费次数与登录解锁状态栏 */}
        <div className="flex flex-wrap items-center gap-2.5">
          {isAuthenticated || quota.unlimited ? (
            <div className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 px-3.5 py-2 text-xs font-semibold text-emerald-200">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>已登录会员 · AI 命盘精批与合盘无限次畅享</span>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-white/10 border border-amber-400/30 px-3.5 py-1.5 text-xs">
              <span className="text-amber-200">
                游客免费 AI 批断额度：
                <strong className="ml-1 text-sm text-amber-400">
                  {quota.remaining} / {quota.total}
                </strong>{" "}
                次
              </span>
              <button
                type="button"
                onClick={() => openAuthModal("login")}
                className="inline-flex items-center gap-1 rounded-xl bg-amber-400 px-3 py-1 text-xs font-bold text-stone-950 hover:bg-amber-300 transition cursor-pointer"
              >
                <UserCheck className="h-3.5 w-3.5" />
                <span>登录解锁无限次</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB 1: 紫微排盘主工作台 (Chart Workbench)
         ═══════════════════════════════════════════════════════════════════════ */}
      {mainTab === "chart" && (
        <div className="space-y-6">
          {/* 生辰录入与真太阳时/夏令时/流派/名人控制面板 */}
          <div className="rounded-3xl border border-stone-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-3.5">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-stone-900 flex items-center gap-2">
                  <Compass className="h-5 w-5 text-amber-700" />
                  <span>生辰八字与真太阳时排盘参数</span>
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  支持全国省市经度真太阳时校正（NOAA 均时差）、1986–1991 夏令时提醒与《斗数全书》金标准盘口径
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    saveHistory(formA);
                    setShowHistoryDrawer((v) => !v);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-100 cursor-pointer"
                >
                  <History className="h-3.5 w-3.5 text-amber-700" />
                  <span>保存/历史命盘 ({history.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowSchoolDrawer((v) => !v)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-100 cursor-pointer"
                >
                  <Settings2 className="h-3.5 w-3.5 text-amber-700" />
                  <span>流派与闰月口径</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyShareUrl}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-amber-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-800 cursor-pointer"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  <span>{shareCopied ? "已复制排盘链接！" : "分享此命盘"}</span>
                </button>
              </div>
            </div>

            {/* 历史记录折叠抽屉 */}
            {showHistoryDrawer && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-950">
                    最近保存的排盘记录（最多保存 12 条，存于本地浏览器）
                  </span>
                  {history.length > 0 && (
                    <button
                      type="button"
                      onClick={clearHistory}
                      className="text-rose-700 hover:underline font-semibold cursor-pointer"
                    >
                      清空全部
                    </button>
                  )}
                </div>
                {history.length === 0 ? (
                  <p className="text-xs text-stone-500">暂无历史排盘记录</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {history.map((item) => (
                      <div
                        key={item.id}
                        className="inline-flex items-center gap-2 rounded-xl border border-amber-300/80 bg-white px-3 py-1.5 text-xs shadow-2xs"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setFormA(item.form);
                            setAiMessages([]);
                          }}
                          className="font-semibold text-stone-800 hover:text-amber-900 cursor-pointer"
                        >
                          {item.label}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeHistory(item.id)}
                          className="text-stone-400 hover:text-rose-600 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 流派设置折叠抽屉 */}
            {showSchoolDrawer && (
              <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-bold text-stone-800 block">
                    星曜庙旺利陷亮度口径：
                  </label>
                  <select
                    value={brightnessSchool}
                    onChange={(e) =>
                      setBrightnessSchoolState(e.target.value as SchoolBrightnessKind)
                    }
                    className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-900"
                  >
                    <option value="default">《紫微斗数全书》定本（金标准默认口径）</option>
                    <option value="XD1">现代修订亮度表（第一版 XD1）</option>
                    <option value="XD2">现代修订亮度表（第二版 XD2）</option>
                    <option value="ZZ">中州派（王亭之传本亮度表）</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-stone-800 block">
                    农历闰月排盘分界规则：
                  </label>
                  <select
                    value={leapPolicy}
                    onChange={(e) => setLeapPolicy(e.target.value as LeapMonth)}
                    className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-900"
                  >
                    <option value="split">月中分界（前15天归本月，后15天归下月 · 默认）</option>
                    <option value="next-month">倪海厦《天纪》口径（闰月整月随下月论）</option>
                    <option value="prev-month">传统整月归本月（闰四月作四月论）</option>
                    <option value="origin-month">保持原闰月标记</option>
                  </select>
                </div>
              </div>
            )}

            {/* 表单输入网格 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5">
              {/* 姓名与性别 */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-600">姓名/称呼</label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={formA.name}
                    onChange={(e) => setFormA({ ...formA, name: e.target.value })}
                    placeholder="命主姓名"
                    className="w-full rounded-xl border border-stone-300 px-3 py-2 text-xs font-semibold text-stone-900"
                  />
                  <div className="flex rounded-xl border border-stone-300 bg-stone-100 p-0.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setFormA({ ...formA, gender: "male" })}
                      className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition cursor-pointer ${
                        formA.gender === "male"
                          ? "bg-amber-900 text-white"
                          : "text-stone-600"
                      }`}
                    >
                      男
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormA({ ...formA, gender: "female" })}
                      className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition cursor-pointer ${
                        formA.gender === "female"
                          ? "bg-rose-700 text-white"
                          : "text-stone-600"
                      }`}
                    >
                      女
                    </button>
                  </div>
                </div>
              </div>

              {/* 公历年/月/日 */}
              <div className="space-y-1 lg:col-span-2">
                <label className="text-xs font-semibold text-stone-600">
                  出生公历日期（阳历 1900–2040）
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <select
                    value={formA.year}
                    onChange={(e) => {
                      setFormA({ ...formA, year: e.target.value });
                      setDstAdjustedA(false);
                    }}
                    className="rounded-xl border border-stone-300 bg-white px-2.5 py-2 text-xs font-semibold text-stone-900"
                  >
                    {Array.from({ length: 125 }, (_, i) => 1915 + i).map((y) => (
                      <option key={y} value={String(y)}>
                        {y}年
                      </option>
                    ))}
                  </select>
                  <select
                    value={formA.month}
                    onChange={(e) => {
                      setFormA({ ...formA, month: e.target.value });
                      setDstAdjustedA(false);
                    }}
                    className="rounded-xl border border-stone-300 bg-white px-2.5 py-2 text-xs font-semibold text-stone-900"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <option key={m} value={String(m)}>
                        {m}月
                      </option>
                    ))}
                  </select>
                  <select
                    value={formA.day}
                    onChange={(e) => {
                      setFormA({ ...formA, day: e.target.value });
                      setDstAdjustedA(false);
                    }}
                    className="rounded-xl border border-stone-300 bg-white px-2.5 py-2 text-xs font-semibold text-stone-900"
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={String(d)}>
                        {d}日
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 出生时刻 / 时辰 */}
              <div className="space-y-1 lg:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-stone-600">
                    {formA.unknownTime ? "直接选择出生时辰" : "钟表时间（自动算真太阳时）"}
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setFormA((prev) => ({ ...prev, unknownTime: !prev.unknownTime }))
                    }
                    className="text-[11px] font-semibold text-amber-800 hover:underline cursor-pointer"
                  >
                    {formA.unknownTime ? "切换为精确钟表时分" : "只知时辰？点此切换"}
                  </button>
                </div>

                {formA.unknownTime ? (
                  <select
                    value={shichenBranchA}
                    onChange={(e) => setShichenBranchA(Number(e.target.value))}
                    className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-900"
                  >
                    {SHICHEN.map((sc) => (
                      <option key={sc.branch} value={sc.branch}>
                        {sc.name}（{sc.range}）
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="grid grid-cols-2 gap-1.5">
                    <select
                      value={formA.clockHour}
                      onChange={(e) => setFormA({ ...formA, clockHour: e.target.value })}
                      className="rounded-xl border border-stone-300 bg-white px-2.5 py-2 text-xs font-semibold text-stone-900"
                    >
                      {Array.from({ length: 24 }, (_, i) => i).map((h) => (
                        <option key={h} value={String(h)}>
                          {String(h).padStart(2, "0")} 点
                        </option>
                      ))}
                    </select>
                    <select
                      value={formA.clockMinute}
                      onChange={(e) => setFormA({ ...formA, clockMinute: e.target.value })}
                      className="rounded-xl border border-stone-300 bg-white px-2.5 py-2 text-xs font-semibold text-stone-900"
                    >
                      {Array.from({ length: 60 }, (_, i) => i).map((m) => (
                        <option key={m} value={String(m)}>
                          {String(m).padStart(2, "0")} 分
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* 出生地经度（真太阳时） */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-600 flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-amber-700" />
                  <span>出生地（真太阳时）</span>
                </label>
                <div className="grid grid-cols-2 gap-1">
                  <select
                    value={formA.province}
                    onChange={(e) => {
                      const provName = e.target.value;
                      const prov = PROVINCES.find((p) => p.name === provName);
                      const firstCity = prov?.cities[0];
                      setFormA({
                        ...formA,
                        province: provName,
                        city: firstCity?.name || "",
                        longitude: firstCity?.longitude || 120,
                      });
                    }}
                    className="rounded-xl border border-stone-300 bg-white px-2 py-2 text-xs font-semibold text-stone-900"
                  >
                    <option value="">标准120°E</option>
                    {PROVINCES.map((p) => (
                      <option key={p.name} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={formA.city}
                    disabled={!formA.province}
                    onChange={(e) => {
                      const prov = PROVINCES.find((p) => p.name === formA.province);
                      const cityObj = prov?.cities.find((c) => c.name === e.target.value);
                      if (cityObj) {
                        setFormA({
                          ...formA,
                          city: cityObj.name,
                          longitude: cityObj.longitude,
                        });
                      }
                    }}
                    className="rounded-xl border border-stone-300 bg-white px-2 py-2 text-xs font-semibold text-stone-900 disabled:opacity-50"
                  >
                    {!formA.province ? (
                      <option value="">不校正</option>
                    ) : (
                      PROVINCES.find((p) => p.name === formA.province)?.cities.map((c) => (
                        <option key={c.name} value={c.name}>
                          {c.name} ({c.longitude}°)
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>
            </div>

            {/* 真太阳时换算结果与夏令时智能提醒条 */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-stone-50 border border-stone-200/80 px-4 py-2.5 text-xs">
              <div className="flex flex-wrap items-center gap-3 text-stone-600">
                <span className="inline-flex items-center gap-1 font-semibold text-stone-800">
                  <Clock className="h-3.5 w-3.5 text-amber-700" />
                  <span>排盘时辰核定：</span>
                </span>
                {formA.unknownTime ? (
                  <span>
                    按指定时辰【<strong>{BRANCHES[shichenBranchA]}时</strong>】直接排盘
                  </span>
                ) : (
                  <span>
                    钟表 {formA.clockHour.padStart(2, "0")}:{formA.clockMinute.padStart(2, "0")}{" "}
                    {formA.province
                      ? `→ 经度 ${formA.longitude}°E (${
                          solarTimeDetailA.longitudeCorrectionMinutes >= 0 ? "+" : ""
                        }${solarTimeDetailA.longitudeCorrectionMinutes.toFixed(1)}分) + 均时差 (${
                          solarTimeDetailA.equationOfTimeMinutes >= 0 ? "+" : ""
                        }${solarTimeDetailA.equationOfTimeMinutes.toFixed(1)}分) = 真太阳时 ${String(
                          solarTimeDetailA.hour
                        ).padStart(2, "0")}:${String(solarTimeDetailA.minute).padStart(2, "0")}`
                      : "（未选省市，按东八区 120°E 标准时）"}{" "}
                    → 核定【
                    <strong className="text-amber-900">
                      {BRANCHES[solarTimeDetailA.branch]}时
                    </strong>
                    】
                  </span>
                )}
              </div>

              {/* 夏令时提醒与一键减1小时 */}
              {dstInfoA.active && !formA.unknownTime && (
                <div className="flex items-center gap-2 rounded-xl bg-amber-100/90 border border-amber-300 px-3 py-1 text-amber-950">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-700 shrink-0" />
                  <span>
                    {dstInfoA.year}年{dstInfoA.range?.start}–{dstInfoA.range?.end}实行过
                    <strong>中国夏令时</strong>（钟表拨快1小时）
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const delta = dstAdjustedA ? 60 : -60;
                      const shifted = shiftClock(
                        { clockHour: formA.clockHour, clockMinute: formA.clockMinute },
                        delta
                      );
                      if (shifted) {
                        setFormA({
                          ...formA,
                          clockHour: shifted.clockHour,
                          clockMinute: shifted.clockMinute,
                        });
                        setDstAdjustedA(!dstAdjustedA);
                      }
                    }}
                    className="inline-flex items-center gap-1 rounded-lg bg-amber-900 px-2.5 py-0.5 text-[11px] font-bold text-white hover:bg-amber-800 cursor-pointer"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>{dstAdjustedA ? "撤销减1小时" : "一键减1小时还原标准时"}</span>
                  </button>
                </div>
              )}
            </div>

            {/* 名人命盘一键研究案例栏 */}
            <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-1">
              <span className="text-xs font-bold text-stone-500 shrink-0">
                🌟 名人命盘案例：
              </span>
              {FAMOUS_PERSONS.map((fp) => (
                <button
                  key={fp.id}
                  type="button"
                  onClick={() => applyFamousPerson(fp)}
                  title={`${fp.description}：${fp.notable}`}
                  className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold transition cursor-pointer ${
                    formA.name === fp.name
                      ? "border-amber-800 bg-amber-900 text-white"
                      : "border-stone-200 bg-stone-50 text-stone-700 hover:border-amber-400 hover:bg-amber-50"
                  }`}
                >
                  {fp.name}
                  <span className="ml-1 text-[10px] opacity-75">({fp.category})</span>
                </button>
              ))}
            </div>
          </div>

          {/* 排盘错误提示或完整十二宫命盘 + 分析工作台 */}
          {chartAResult.error || !chart ? (
            <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-center text-sm font-semibold text-rose-800">
              ⚠️ {chartAResult.error || "排盘计算失败，请检查输入的生辰参数"}
            </div>
          ) : (
            <div className="space-y-6">
              {/* 4x4 紫微十二宫星盘组件 */}
              <ZiweiChartBoard
                chart={chart}
                selectedBranch={selectedBranch}
                onSelectBranch={setSelectedBranch}
                onAskPalaceAI={(palace: Palace) => {
                  const prompt = `请按倪海厦《天纪》体系，重点结合我的【${palace.name}】（${STEMS[palace.stem]}${BRANCHES[palace.branch]}宫）及其三方四正会照星曜，为我深度批断该宫位所代表的运势吉凶与破局建议。`;
                  void sendInterpretQuestion(prompt);
                }}
                onAskStarAI={(starName: string, palace: Palace) => {
                  const prompt = `我的【${palace.name}】坐有【${starName}】，请按倪海厦《天纪》与《紫微斗数全书》，结合本盘的三方四正与四化，详细解读这颗星在我命盘中的具体吉凶作用与人生建议。`;
                  void sendInterpretQuestion(prompt);
                }}
              />

              {/* ─── 下方三大深度分析中心（AI 命理师精批 / 13 维确定性断语 / 古籍格局识别） ─── */}
              <div className="rounded-3xl border border-stone-200 bg-white p-5 sm:p-6 shadow-xs space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-4">
                  <div className="flex flex-wrap items-center gap-2">
                    {(
                      [
                        {
                          id: "ai",
                          label: "✨ AI 宗师深度批断（倪师天纪体系）",
                        },
                        {
                          id: "dimensions",
                          label: "📜 13 维全息确定性断语（零延迟秒出）",
                        },
                        {
                          id: "patterns",
                          label: `🏆 古籍格局识别（命中 ${patternsList.length} 格）`,
                        },
                      ] as const
                    ).map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setAnalysisTab(t.id)}
                        className={`rounded-2xl px-4 py-2 text-xs sm:text-sm font-bold transition cursor-pointer ${
                          analysisTab === t.id
                            ? "bg-amber-900 text-white shadow-xs"
                            : "bg-stone-100 text-stone-700 hover:bg-stone-200/80"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>

                  {!isAuthenticated && !quota.unlimited && (
                    <div className="text-xs text-stone-500 flex items-center gap-2">
                      <span>
                        AI 批断剩余免费体验：
                        <strong className="text-amber-800">{quota.remaining}</strong> /{" "}
                        {quota.total} 次
                      </span>
                      <button
                        type="button"
                        onClick={() => openAuthModal("login")}
                        className="text-amber-800 font-bold hover:underline cursor-pointer"
                      >
                        登录解锁无限次 →
                      </button>
                    </div>
                  )}
                </div>

                {/* 子面板 1：AI 命理师流式精批 */}
                {analysisTab === "ai" && (
                  <div className="space-y-4">
                    {/* 六大专题一键批断按钮 */}
                    <div className="space-y-2">
                      <div className="text-xs font-bold text-stone-600">
                        👇 点击下方专题一键生成《天纪》深度命书，或在盘面点击任意宫位/星曜直接发问：
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                        {QUICK_AI_TOPICS.map((topic) => (
                          <button
                            key={topic.label}
                            type="button"
                            disabled={aiStreaming}
                            onClick={() => void sendInterpretQuestion(topic.prompt)}
                            className="flex items-center justify-between rounded-2xl border border-amber-900/15 bg-amber-50/50 hover:bg-amber-100/70 p-3 text-left text-xs font-bold text-amber-950 transition cursor-pointer disabled:opacity-50"
                          >
                            <span>{topic.label}</span>
                            <Sparkles className="h-3.5 w-3.5 text-amber-700 shrink-0" />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 错误或登录拦截提示 */}
                    {aiError && (
                      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-950">
                        <div className="flex items-center gap-2 font-semibold">
                          <Lock className="h-4 w-4 text-amber-800 shrink-0" />
                          <span>{aiError}</span>
                        </div>
                        {!isAuthenticated && (
                          <button
                            type="button"
                            onClick={() => openAuthModal("login")}
                            className="rounded-xl bg-amber-900 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-amber-800 cursor-pointer"
                          >
                            立即登录 / 注册账号
                          </button>
                        )}
                      </div>
                    )}

                    {/* 对话消息流展示区 */}
                    {aiMessages.length > 0 && (
                      <div className="space-y-3 rounded-2xl border border-stone-200 bg-[#fdfbf7] p-4 max-h-[540px] overflow-y-auto">
                        {aiMessages.map((msg, i) => (
                          <div
                            key={i}
                            className={`rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                              msg.role === "user"
                                ? "bg-amber-900 text-amber-50 ml-auto max-w-2xl font-medium whitespace-pre-wrap"
                                : "bg-white border border-stone-200/90 text-stone-800 shadow-2xs"
                            }`}
                          >
                            <div className="text-[10px] font-mono uppercase opacity-70 mb-1">
                              {msg.role === "user" ? "命主提问" : "天纪 AI 命理宗师"}
                            </div>
                            {msg.role === "user" ? (
                              <div>{msg.content}</div>
                            ) : (
                              <div className="prose prose-stone prose-sm max-w-none dark:prose-invert leading-relaxed break-words">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                  {msg.content ||
                                    (aiStreaming && i === aiMessages.length - 1
                                      ? "正在推演三方四正与四化星象，请稍候..."
                                      : "")}
                                </ReactMarkdown>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 自由追问输入框 */}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        void sendInterpretQuestion(aiInput);
                      }}
                      className="flex gap-2"
                    >
                      <input
                        type="text"
                        value={aiInput}
                        onChange={(e) => setAiInput(e.target.value)}
                        placeholder="结合当前命盘自由追问（例如：我适合去南方发展吗？哪一年最适合买房或结婚？）..."
                        className="flex-1 rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-xs sm:text-sm text-stone-900 focus:border-amber-700 focus:bg-white focus:outline-none"
                      />
                      <button
                        type="submit"
                        disabled={aiStreaming || !aiInput.trim()}
                        className="inline-flex items-center gap-1.5 rounded-2xl bg-amber-900 px-5 py-3 text-xs sm:text-sm font-bold text-white hover:bg-amber-800 disabled:opacity-50 cursor-pointer"
                      >
                        <Send className="h-4 w-4" />
                        <span>{aiStreaming ? "推演中..." : "发送批断"}</span>
                      </button>
                    </form>
                  </div>
                )}

                {/* 子面板 2：13 维全息确定性断语（本地秒出，不耗 AI 额度） */}
                {analysisTab === "dimensions" && dimensions13 && (
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-1.5">
                      {ALL_TOPICS.map((tk) => (
                        <button
                          key={tk}
                          type="button"
                          onClick={() => setActiveDimTopic(tk)}
                          className={`rounded-xl px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                            activeDimTopic === tk
                              ? "bg-amber-900 text-white"
                              : "bg-stone-100 text-stone-700 hover:bg-amber-100/60"
                          }`}
                        >
                          {TOPIC_LABEL[tk]}
                        </button>
                      ))}
                    </div>

                    {(() => {
                      const d = dimensions13[activeDimTopic];
                      if (!d) return null;
                      return (
                        <div className="rounded-2xl border border-amber-900/15 bg-gradient-to-br from-amber-50/40 via-white to-stone-50 p-5 space-y-4">
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200/70 pb-3">
                            <div>
                              <span className="text-xs font-mono text-amber-800 font-bold">
                                对应宫垣：{d.palaceName}
                              </span>
                              <h4 className="text-base sm:text-lg font-bold text-stone-900 mt-0.5">
                                【{d.label}】{d.dingdiao}
                              </h4>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                void sendInterpretQuestion(
                                  `请针对我的【${d.label}】（${d.palaceName}），在本地断语基础上做更深入的流年与大限运势展开解读。`
                                )
                              }
                              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-800 cursor-pointer"
                            >
                              <Sparkles className="h-3.5 w-3.5" />
                              <span>让 AI 深度展开此维度</span>
                            </button>
                          </div>

                          <div className="space-y-3 text-xs sm:text-sm text-stone-700 leading-relaxed">
                            <div className="rounded-xl bg-white border border-stone-200/80 p-3.5">
                              <strong className="text-amber-950 block mb-1">
                                🔮 命理详论（三方四正合参）：
                              </strong>
                              {d.lundian}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div className="rounded-xl bg-stone-50 border border-stone-200/70 p-3.5">
                                <strong className="text-stone-900 block mb-1">
                                  📐 星盘数理依据：
                                </strong>
                                {d.yiju}
                              </div>
                              <div className="rounded-xl bg-amber-50/60 border border-amber-200/70 p-3.5">
                                <strong className="text-amber-950 block mb-1">
                                  📖 典籍与《天纪》出处：
                                </strong>
                                {d.chuchu}
                              </div>
                            </div>

                            <div className="rounded-xl bg-emerald-50/70 border border-emerald-200 p-3.5 text-emerald-950">
                              <strong className="block mb-0.5">💡 倪师趋吉避凶建议：</strong>
                              {d.advice}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* 子面板 3：古籍格局识别 */}
                {analysisTab === "patterns" && (
                  <div className="space-y-4">
                    {patternsList.length === 0 ? (
                      <div className="rounded-2xl border border-stone-200 bg-stone-50 p-6 text-center text-xs text-stone-600">
                        本盘暂无典型特殊命格，以命宫及三方四正主星庙旺与四化组合论断。
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {patternsList.map((pt) => (
                          <div
                            key={pt.name}
                            className="rounded-2xl border border-stone-200 bg-stone-50/50 p-4 space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                                <Award className="h-4 w-4 text-amber-700" />
                                <span>【{pt.name}】</span>
                              </span>
                              <span
                                className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                                  pt.level === "excellent"
                                    ? "bg-amber-100 text-amber-900"
                                    : pt.level === "good"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : pt.level === "caution"
                                    ? "bg-rose-100 text-rose-800"
                                    : "bg-stone-200 text-stone-700"
                                }`}
                              >
                                {pt.level === "excellent"
                                  ? "上格 · 富贵佳局"
                                  : pt.level === "good"
                                  ? "吉格 · 顺遂有成"
                                  : pt.level === "caution"
                                  ? "磨砺格 · 破而后立"
                                  : "特殊格局"}
                              </span>
                            </div>

                            <p className="text-xs text-stone-700 leading-relaxed">
                              {pt.description}
                            </p>

                            {pt.conditions && (
                              <div className="space-y-1 pt-1 text-[11px] text-stone-600">
                                {pt.conditions.required.length > 0 && (
                                  <div>
                                    <strong className="text-emerald-800">✓ 成格条件：</strong>
                                    {pt.conditions.required.join("；")}
                                  </div>
                                )}
                                {pt.conditions.bonus && pt.conditions.bonus.length > 0 && (
                                  <div>
                                    <strong className="text-amber-800">★ 格局加分：</strong>
                                    {pt.conditions.bonus.join("；")}
                                  </div>
                                )}
                                {pt.conditions.breaking && pt.conditions.breaking.length > 0 && (
                                  <div>
                                    <strong className="text-rose-700">⚠ 破格留意：</strong>
                                    {pt.conditions.breaking.join("；")}
                                  </div>
                                )}
                              </div>
                            )}

                            {pt.source && (
                              <div className="text-[11px] text-stone-400 italic pt-1">
                                出处：{pt.source}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB 2: 双人合盘姻缘工作台 (Dual-Chart Synastry Workbench)
         ═══════════════════════════════════════════════════════════════════════ */}
      {mainTab === "heming" && (
        <div className="space-y-6">
          {/* 双人生辰输入卡 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {(
              [
                {
                  title: "甲方（命主 A）生辰信息",
                  badge: "甲方",
                  form: formA,
                  setForm: setFormA,
                  accent: "border-amber-900/20 bg-amber-50/20",
                },
                {
                  title: "乙方（伴侣 / 合伙人 B）生辰信息",
                  badge: "乙方",
                  form: formB,
                  setForm: setFormB,
                  accent: "border-rose-900/20 bg-rose-50/20",
                },
              ] as const
            ).map((side) => (
              <div
                key={side.badge}
                className={`rounded-3xl border p-5 shadow-xs space-y-4 ${side.accent}`}
              >
                <div className="flex items-center justify-between border-b border-stone-200/70 pb-2.5">
                  <h3 className="text-sm sm:text-base font-bold text-stone-900">
                    {side.title}
                  </h3>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => side.setForm({ ...side.form, gender: "male" })}
                      className={`rounded-lg px-2.5 py-1 text-xs font-bold cursor-pointer ${
                        side.form.gender === "male"
                          ? "bg-amber-900 text-white"
                          : "bg-white text-stone-600"
                      }`}
                    >
                      男命
                    </button>
                    <button
                      type="button"
                      onClick={() => side.setForm({ ...side.form, gender: "female" })}
                      className={`rounded-lg px-2.5 py-1 text-xs font-bold cursor-pointer ${
                        side.form.gender === "female"
                          ? "bg-rose-700 text-white"
                          : "bg-white text-stone-600"
                      }`}
                    >
                      女命
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                  <input
                    type="text"
                    value={side.form.name}
                    onChange={(e) => side.setForm({ ...side.form, name: e.target.value })}
                    placeholder="姓名"
                    className="rounded-xl border border-stone-300 bg-white px-2.5 py-2 font-semibold"
                  />
                  <select
                    value={side.form.year}
                    onChange={(e) => side.setForm({ ...side.form, year: e.target.value })}
                    className="rounded-xl border border-stone-300 bg-white px-2 py-2 font-semibold"
                  >
                    {Array.from({ length: 100 }, (_, i) => 1940 + i).map((y) => (
                      <option key={y} value={String(y)}>
                        {y}年
                      </option>
                    ))}
                  </select>
                  <select
                    value={side.form.month}
                    onChange={(e) => side.setForm({ ...side.form, month: e.target.value })}
                    className="rounded-xl border border-stone-300 bg-white px-2 py-2 font-semibold"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <option key={m} value={String(m)}>
                        {m}月
                      </option>
                    ))}
                  </select>
                  <select
                    value={side.form.day}
                    onChange={(e) => side.setForm({ ...side.form, day: e.target.value })}
                    className="rounded-xl border border-stone-300 bg-white px-2 py-2 font-semibold"
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={String(d)}>
                        {d}日
                      </option>
                    ))}
                  </select>
                  <select
                    value={side.form.clockHour}
                    onChange={(e) =>
                      side.setForm({
                        ...side.form,
                        clockHour: e.target.value,
                        unknownTime: false,
                      })
                    }
                    className="rounded-xl border border-stone-300 bg-white px-2 py-2 font-semibold"
                  >
                    {Array.from({ length: 24 }, (_, i) => i).map((h) => (
                      <option key={h} value={String(h)}>
                        {String(h).padStart(2, "0")}:00 ({BRANCHES[Math.floor(((h + 1) % 24) / 2)]}时)
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>

          {/* 本地五步合参即时报告 */}
          {localHeming && chart && chartB && (
            <div className="rounded-3xl border border-amber-900/20 bg-white p-6 shadow-xs space-y-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-100 pb-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="rounded-2xl bg-amber-900 px-3.5 py-1.5 text-lg font-bold text-amber-50">
                      {localHeming.score} 分
                    </span>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-stone-900">
                        {localHeming.ratingTitle}（{"★".repeat(localHeming.stars)}
                        {"☆".repeat(5 - localHeming.stars)}）
                      </h3>
                      <p className="text-xs text-stone-500">
                        基于倪海厦《天纪》「夫妻宫+福德宫双宫联参」与「生年四化飞星互参」五步法
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={hemingStreaming}
                  onClick={() =>
                    void sendHemingQuestion(
                      "请根据我们两人的完整命盘，按倪海厦《天纪》合盘五步法（夫妻宫与命宫互映、夫妻宫与福德宫双宫联参、生年四化飞化互参、大限同步），为我们撰写一份详尽的双人姻缘与事业合盘报告，并给出具体的相处之道与化解建议。"
                    )
                  }
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-800 to-rose-800 px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-md hover:opacity-95 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>
                    {hemingStreaming ? "AI 宗师正在合盘推演..." : "启动 AI 双人合盘深度批断"}
                  </span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {localHeming.steps.map((st) => (
                  <div
                    key={st.title}
                    className="rounded-2xl border border-stone-200 bg-stone-50/70 p-4 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm font-bold text-stone-900">
                        {st.title}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                          st.tag === "大吉"
                            ? "bg-emerald-100 text-emerald-800"
                            : st.tag === "吉"
                            ? "bg-amber-100 text-amber-900"
                            : "bg-stone-200 text-stone-700"
                        }`}
                      >
                        {st.tag}
                      </span>
                    </div>
                    <p className="text-xs text-stone-600 leading-relaxed">{st.detail}</p>
                  </div>
                ))}
              </div>

              {/* 生年四化双向飞星落宫表 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                <div className="rounded-2xl border border-amber-200/80 bg-amber-50/30 p-4 space-y-2">
                  <div className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                    <Flame className="h-4 w-4 text-amber-700" />
                    <span>
                      {chart.birthInfo.name || "甲方"}（{STEMS[chart.lunarInfo.yearStem]}年）四化飞入{" "}
                      {chartB.birthInfo.name || "乙方"}命盘：
                    </span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    {localHeming.flyAtoB.map((item) => (
                      <div key={item.siHua} className="flex items-start gap-2">
                        <span className="rounded bg-amber-900 px-1.5 py-0.5 text-[10px] font-bold text-white shrink-0">
                          化{item.siHua}
                        </span>
                        <span className="text-stone-700">
                          <strong>{item.star}</strong> → 落入乙方【
                          <strong>{item.targetPalace}</strong>】：{item.meaning}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-rose-200/80 bg-rose-50/30 p-4 space-y-2">
                  <div className="text-xs font-bold text-rose-950 flex items-center gap-1.5">
                    <Flame className="h-4 w-4 text-rose-700" />
                    <span>
                      {chartB.birthInfo.name || "乙方"}（{STEMS[chartB.lunarInfo.yearStem]}年）四化飞入{" "}
                      {chart.birthInfo.name || "甲方"}命盘：
                    </span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    {localHeming.flyBtoA.map((item) => (
                      <div key={item.siHua} className="flex items-start gap-2">
                        <span className="rounded bg-rose-800 px-1.5 py-0.5 text-[10px] font-bold text-white shrink-0">
                          化{item.siHua}
                        </span>
                        <span className="text-stone-700">
                          <strong>{item.star}</strong> → 落入甲方【
                          <strong>{item.targetPalace}</strong>】：{item.meaning}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* AI 合盘流式对话区 */}
              {hemingError && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-950">
                  <span className="font-semibold">🔒 {hemingError}</span>
                  {!isAuthenticated && (
                    <button
                      type="button"
                      onClick={() => openAuthModal("login")}
                      className="rounded-xl bg-amber-900 px-3.5 py-1.5 text-xs font-bold text-white cursor-pointer"
                    >
                      立即登录解锁无限次
                    </button>
                  )}
                </div>
              )}

              {hemingMessages.length > 0 && (
                <div className="space-y-3 rounded-2xl border border-stone-200 bg-[#fdfbf7] p-4 max-h-[520px] overflow-y-auto">
                  {hemingMessages.map((m, idx) => (
                    <div
                      key={idx}
                      className={`rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                        m.role === "user"
                          ? "bg-amber-900 text-white ml-auto max-w-2xl"
                          : "bg-white border border-stone-200 text-stone-800 whitespace-pre-wrap"
                      }`}
                    >
                      {m.content || (hemingStreaming ? "正在合参双方夫妻宫、福德宫与四化飞星..." : "")}
                    </div>
                  ))}
                </div>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void sendHemingQuestion(hemingInput);
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={hemingInput}
                  onChange={(e) => setHemingInput(e.target.value)}
                  placeholder="针对双人合盘继续追问（如：我们俩谁管钱更聚财？2026–2027年适合结婚或共同投资吗？）..."
                  className="flex-1 rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-xs sm:text-sm"
                />
                <button
                  type="submit"
                  disabled={hemingStreaming || !hemingInput.trim()}
                  className="inline-flex items-center gap-1.5 rounded-2xl bg-amber-900 px-5 py-3 text-xs sm:text-sm font-bold text-white hover:bg-amber-800 disabled:opacity-50 cursor-pointer"
                >
                  <Send className="h-4 w-4" />
                  <span>发送追问</span>
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: 十四主星百科 */}
      {mainTab === "knowledge" && <ZiweiKnowledgeView />}

      {/* TAB 4: 三大古籍原典库 */}
      {mainTab === "library" && <ZiweiClassicsLibraryView />}

      {/* TAB 5: 倪海厦三纪学堂 */}
      {mainTab === "sanji" && <ZiweiSanjiSchoolView />}
    </div>
  );
}
