"use client";

import { useState, useMemo } from "react";
import { STAR_MASTER_ARCHIVE, BRANCH_ORGAN_MAP } from "@/lib/ziwei/db-analysis";
import { STEMS, SI_HUA_TABLE } from "@/lib/ziwei/constants";
import { ALL_BOOKS, TOTAL_PARAGRAPHS, searchClassics } from "@/lib/classics";
import {
  NI_HAIXIA_BIO,
  TIANJI_MODULES,
  HEXAGRAMS,
  FENGSHUI_ENTRIES,
  TIANJI_QUOTES,
  DIJI_MODULES,
  RENJI_MODULES,
  ACU_EXPERIENCES,
  HANTANG_FORMULAS,
} from "@/lib/nihai";
import {
  Search,
  BookOpen,
  Star,
  Flame,
  Compass,
  HeartPulse,
  ScrollText,
  Sparkles,
} from "lucide-react";

export function ZiweiKnowledgeView() {
  const [groupFilter, setGroupFilter] = useState<"全部" | "紫微系" | "天府系">("全部");
  const [selectedStar, setSelectedStar] = useState<string>("紫微");

  const starsList = useMemo(() => {
    const all = Object.values(STAR_MASTER_ARCHIVE);
    if (groupFilter === "全部") return all;
    return all.filter((s) => s.group === groupFilter);
  }, [groupFilter]);

  const activeStar = STAR_MASTER_ARCHIVE[selectedStar] || STAR_MASTER_ARCHIVE["紫微"];

  return (
    <div className="space-y-8">
      {/* 顶部倪师四大论命心法 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          {
            title: "命宫为本 · 三方为用",
            desc: "看任何一宫绝不孤立定吉凶，必合参对宫冲照与财官三合宫，本宫无正曜则借对宫主星。",
          },
          {
            title: "看婚姻必同参福德宫",
            desc: "夫妻宫看显性互动与配偶习性，福德宫看深层婚姻福报与能否白头偕老，双宫联参方得真机。",
          },
          {
            title: "生年四化定先天课题",
            desc: "化禄主财源顺遂，化权主执掌突破，化科主贵人声名，化忌主一生最需修心防微之功课。",
          },
          {
            title: "子午流注合参疾厄",
            desc: "十二地支对应十二经络脏腑，结合疾厄宫与全盘煞忌聚集之宫位，直接定位先天养生重点。",
          },
        ].map((item) => (
          <div
            key={item.title}
            className="rounded-2xl border border-amber-900/15 bg-gradient-to-br from-amber-50/80 to-white p-4 shadow-xs"
          >
            <h4 className="text-sm font-bold text-amber-950 flex items-center gap-1.5 mb-1.5">
              <Sparkles className="h-4 w-4 text-amber-700" />
              <span>{item.title}</span>
            </h4>
            <p className="text-xs text-stone-600 leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* 十四主星百科全书 */}
      <div className="rounded-3xl border border-stone-200 bg-white p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-600 fill-amber-500" />
              <span>十四主星《天纪》与《全书》全息档案</span>
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              点击任一主星查阅倪海厦《天纪》心法、古籍赋文、事业/财帛/婚恋及中医脏腑关联
            </p>
          </div>

          <div className="flex items-center gap-1.5 rounded-xl bg-stone-100 p-1">
            {(["全部", "紫微系", "天府系"] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGroupFilter(g)}
                className={`rounded-lg px-3 py-1 text-xs font-semibold transition cursor-pointer ${
                  groupFilter === g
                    ? "bg-amber-900 text-white shadow-2xs"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* 主星选择胶囊 */}
        <div className="flex flex-wrap gap-2">
          {starsList.map((item) => {
            const active = item.name === activeStar.name;
            return (
              <button
                key={item.name}
                type="button"
                onClick={() => setSelectedStar(item.name)}
                className={`rounded-xl border px-3.5 py-2 text-left transition cursor-pointer ${
                  active
                    ? "border-amber-800 bg-amber-900 text-white shadow-sm"
                    : "border-stone-200 bg-stone-50/70 text-stone-800 hover:border-amber-400 hover:bg-amber-50/40"
                }`}
              >
                <div className="text-sm font-bold">{item.name}</div>
                <div
                  className={`text-[10px] ${
                    active ? "text-amber-200" : "text-stone-500"
                  }`}
                >
                  {item.element} · {item.role.split("·")[0]}
                </div>
              </button>
            );
          })}
        </div>

        {/* 当前选中主星详情卡 */}
        <div className="rounded-2xl border border-amber-900/15 bg-gradient-to-br from-amber-50/40 via-white to-stone-50 p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200/70 pb-3">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-2xl font-bold text-amber-950">【{activeStar.name}星】</span>
                <span className="rounded-full bg-amber-100 px-3 py-0.5 text-xs font-bold text-amber-900">
                  {activeStar.group}
                </span>
                <span className="rounded-full bg-stone-200 px-3 py-0.5 text-xs font-semibold text-stone-800">
                  {activeStar.element}（{activeStar.yinYang}）
                </span>
                <span className="rounded-full bg-rose-50 border border-rose-200 px-3 py-0.5 text-xs font-semibold text-rose-900">
                  {activeStar.role}
                </span>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-stone-700 mt-1.5">
                核心定调：{activeStar.dingdiao}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-2xl bg-amber-50/80 border border-amber-200/80 p-4 space-y-1.5">
              <div className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                <Flame className="h-4 w-4 text-amber-700" />
                <span>倪海厦《天纪》讲义真传</span>
              </div>
              <p className="text-xs sm:text-sm text-stone-800 leading-relaxed">
                {activeStar.niTeaching}
              </p>
            </div>

            <div className="rounded-2xl bg-stone-100/80 border border-stone-200 p-4 space-y-1.5">
              <div className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                <BookOpen className="h-4 w-4 text-stone-700" />
                <span>《紫微斗数全书》《骨髓赋》原典</span>
              </div>
              <p className="text-xs sm:text-sm text-stone-700 italic leading-relaxed">
                {activeStar.classicQuote}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="rounded-xl border border-stone-200 bg-white p-3.5 space-y-1">
              <span className="font-bold text-amber-900 block">💼 官禄事业赛道</span>
              <p className="text-stone-600 leading-relaxed">{activeStar.careerTrait}</p>
            </div>
            <div className="rounded-xl border border-stone-200 bg-white p-3.5 space-y-1">
              <span className="font-bold text-emerald-900 block">💰 财帛理财属性</span>
              <p className="text-stone-600 leading-relaxed">{activeStar.wealthTrait}</p>
            </div>
            <div className="rounded-xl border border-stone-200 bg-white p-3.5 space-y-1">
              <span className="font-bold text-rose-900 block">❤️ 夫妻婚恋特质</span>
              <p className="text-stone-600 leading-relaxed">{activeStar.loveTrait}</p>
            </div>
            <div className="rounded-xl border border-stone-200 bg-white p-3.5 space-y-1">
              <span className="font-bold text-indigo-900 block">🩺 中医脏腑对应</span>
              <p className="text-stone-600 leading-relaxed">{activeStar.healthOrgan}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 十天干四化速查表 + 十二地支子午流注脏腑表 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-xs space-y-3">
          <h4 className="text-base font-bold text-stone-900 flex items-center gap-2">
            <Compass className="h-4 w-4 text-amber-700" />
            <span>十天干四化真诀表（《斗数全书》定本）</span>
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50 text-stone-600">
                  <th className="py-2 px-2.5 font-bold">天干</th>
                  <th className="py-2 px-2.5 font-bold text-emerald-700">化禄（财源/顺遂）</th>
                  <th className="py-2 px-2.5 font-bold text-amber-700">化权（执掌/突破）</th>
                  <th className="py-2 px-2.5 font-bold text-sky-700">化科（声名/贵人）</th>
                  <th className="py-2 px-2.5 font-bold text-rose-700">化忌（执念/功课）</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {STEMS.map((stem, idx) => {
                  const row = SI_HUA_TABLE[idx];
                  return (
                    <tr key={stem} className="hover:bg-amber-50/40">
                      <td className="py-2 px-2.5 font-bold text-stone-900">{stem}干</td>
                      <td className="py-2 px-2.5 font-semibold text-emerald-800">{row[0]}</td>
                      <td className="py-2 px-2.5 font-semibold text-amber-800">{row[1]}</td>
                      <td className="py-2 px-2.5 font-semibold text-sky-800">{row[2]}</td>
                      <td className="py-2 px-2.5 font-semibold text-rose-800">{row[3]}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-xs space-y-3">
          <h4 className="text-base font-bold text-stone-900 flex items-center gap-2">
            <HeartPulse className="h-4 w-4 text-rose-600" />
            <span>十二地支 · 倪师子午流注经络脏腑速查</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[340px] overflow-y-auto pr-1">
            {Object.values(BRANCH_ORGAN_MAP).map((item) => (
              <div
                key={item.branch}
                className="rounded-xl border border-stone-200/80 bg-stone-50/60 p-2.5 text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-950">
                    {item.branch}宫 · {item.organ}
                  </span>
                  <span className="font-mono text-[10px] text-stone-500">{item.time}</span>
                </div>
                <p className="text-[11px] text-stone-600 leading-relaxed">{item.advice}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ZiweiClassicsLibraryView() {
  const [selectedBookSlug, setSelectedBookSlug] = useState<string>(ALL_BOOKS[0]?.slug || "gusuifu");
  const [selectedChapterIdx, setSelectedChapterIdx] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const activeBook = useMemo(
    () => ALL_BOOKS.find((b) => b.slug === selectedBookSlug) || ALL_BOOKS[0],
    [selectedBookSlug]
  );

  const activeChapter = activeBook?.chapters[selectedChapterIdx] || activeBook?.chapters[0];

  const searchHits = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return searchClassics(searchQuery, 40);
  }, [searchQuery]);

  return (
    <div className="space-y-6">
      {/* 顶部古籍概览与全文检索框 */}
      <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
              <ScrollText className="h-5 w-5 text-amber-700" />
              <span>紫微斗数三大古籍原典全文库（共收录 {TOTAL_PARAGRAPHS} 条古赋原文）</span>
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              完整收录陈抟祖师《骨髓赋》、明刊本《紫微斗数全集》与罗洪先《紫微斗数全书》，支持毫秒级原典检索
            </p>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜古籍关键词：如 紫微、杀破狼、禄存、夫妻..."
              className="w-full rounded-xl border border-stone-300 bg-stone-50 pl-9 pr-3 py-2 text-xs text-stone-900 focus:border-amber-600 focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        {/* 检索结果展示 */}
        {searchQuery.trim() && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-amber-950">
                「{searchQuery}」全文检索结果（命中 {searchHits.length} 条）
              </span>
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-amber-800 hover:underline font-semibold cursor-pointer"
              >
                清除检索
              </button>
            </div>
            {searchHits.length === 0 ? (
              <p className="text-xs text-stone-500 py-2">未找到包含该词条的古籍段落，请尝试更换单字或星名（如“贪狼”、“天机”）。</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-80 overflow-y-auto pr-1">
                {searchHits.map((hit) => (
                  <button
                    key={hit.paragraphId}
                    type="button"
                    onClick={() => {
                      const book = ALL_BOOKS.find((b) => b.slug === hit.bookSlug);
                      if (book) {
                        setSelectedBookSlug(book.slug);
                        const cIdx = book.chapters.findIndex((c) => c.title === hit.chapterTitle);
                        if (cIdx >= 0) setSelectedChapterIdx(cIdx);
                        setSearchQuery("");
                      }
                    }}
                    className="rounded-xl border border-amber-200/80 bg-white p-3 text-left hover:border-amber-500 transition cursor-pointer space-y-1"
                  >
                    <div className="text-[11px] font-bold text-amber-900">
                      《{hit.bookTitle}》 · {hit.chapterTitle}
                    </div>
                    <p className="text-xs text-stone-700 leading-relaxed line-clamp-3">
                      {hit.text}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 典籍切换卡 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {ALL_BOOKS.map((book) => {
            const active = book.slug === activeBook?.slug;
            return (
              <button
                key={book.slug}
                type="button"
                onClick={() => {
                  setSelectedBookSlug(book.slug);
                  setSelectedChapterIdx(0);
                }}
                className={`rounded-2xl border p-4 text-left transition cursor-pointer ${
                  active
                    ? "border-amber-800 bg-amber-900 text-white shadow-sm"
                    : "border-stone-200 bg-stone-50/70 text-stone-800 hover:border-amber-400"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold">《{book.title}》</span>
                  <span
                    className={`text-[10px] rounded-full px-2 py-0.5 ${
                      active ? "bg-amber-800 text-amber-100" : "bg-stone-200 text-stone-600"
                    }`}
                  >
                    {book.chapters.length} 卷/篇
                  </span>
                </div>
                <p
                  className={`text-[11px] mt-1 ${
                    active ? "text-amber-100/90" : "text-stone-500"
                  }`}
                >
                  {book.author}（{book.dynasty}） · {book.intro}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 章节目录与正文阅读器 */}
      {activeBook && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
          <div className="rounded-3xl border border-stone-200 bg-white p-4 shadow-xs space-y-2 max-h-[620px] overflow-y-auto">
            <div className="text-xs font-bold text-stone-500 uppercase tracking-wider px-2 pb-1 border-b border-stone-100">
              《{activeBook.title}》目录
            </div>
            {activeBook.chapters.map((ch, idx) => (
              <button
                key={`${ch.title}-${idx}`}
                type="button"
                onClick={() => setSelectedChapterIdx(idx)}
                className={`w-full rounded-xl px-3 py-2 text-left text-xs font-medium transition cursor-pointer flex items-center justify-between ${
                  idx === selectedChapterIdx
                    ? "bg-amber-900 text-white font-bold"
                    : "text-stone-700 hover:bg-stone-100"
                }`}
              >
                <span className="truncate">{ch.title}</span>
                <span className="text-[10px] opacity-75 shrink-0 ml-2">
                  {ch.paragraphs.length}条
                </span>
              </button>
            ))}
          </div>

          <div className="lg:col-span-3 rounded-3xl border border-stone-200 bg-[#fdfbf7] p-5 sm:p-7 shadow-xs space-y-4 max-h-[620px] overflow-y-auto">
            {activeChapter && (
              <>
                <div className="border-b border-amber-900/15 pb-3">
                  <h4 className="text-lg font-bold text-amber-950">
                    《{activeBook.title}》 · {activeChapter.title}
                  </h4>
                  <p className="text-xs text-stone-500 mt-0.5">
                    共 {activeChapter.paragraphs.length} 节原典条文
                  </p>
                </div>

                <div className="space-y-3">
                  {activeChapter.paragraphs.map((p, i) => (
                    <div
                      key={p.id}
                      className="rounded-2xl border border-amber-900/10 bg-white/90 p-3.5 text-xs sm:text-sm text-stone-800 leading-relaxed shadow-2xs"
                    >
                      <span className="inline-block font-mono text-[11px] font-bold text-amber-800 mr-2">
                        [{i + 1}]
                      </span>
                      <span>{p.text}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function ZiweiSanjiSchoolView() {
  const [subTab, setSubTab] = useState<"tianji" | "hexagrams" | "renji" | "diji" | "bio">("tianji");
  const [hexSearch, setHexSearch] = useState("");
  const [medSearch, setMedSearch] = useState("");

  const filteredHexagrams = useMemo(() => {
    const q = hexSearch.trim();
    if (!q) return HEXAGRAMS;
    return HEXAGRAMS.filter(
      (h) =>
        h.name.includes(q) ||
        h.composition.includes(q) ||
        h.meaning.includes(q) ||
        h.niInterpretation.includes(q) ||
        String(h.number) === q
    );
  }, [hexSearch]);

  const filteredFormulas = useMemo(() => {
    const q = medSearch.trim();
    if (!q) return HANTANG_FORMULAS.slice(0, 24);
    return HANTANG_FORMULAS.filter(
      (f) =>
        f.name.includes(q) ||
        f.indication.includes(q) ||
        (f.theory && f.theory.includes(q))
    );
  }, [medSearch]);

  return (
    <div className="space-y-6">
      {/* 三纪导航栏 */}
      <div className="rounded-3xl border border-amber-900/20 bg-gradient-to-r from-stone-900 via-amber-950 to-stone-900 p-5 text-white shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-mono text-amber-300 uppercase tracking-widest">
              NI HAIXIA SANJI SYSTEM // 天纪 · 地纪 · 人纪
            </div>
            <h3 className="text-xl font-bold mt-1">
              倪海厦「天纪 · 地纪 · 人纪」五术山医命相卜学术中心
            </h3>
            <p className="text-xs text-stone-300 mt-1">
              上知天文（紫微斗数 · 易经六十四卦 · 阳宅堪舆）、中知人事（针灸 · 经方 · 汉唐百方）、下知地理
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5 rounded-2xl bg-white/10 p-1.5">
            {(
              [
                { id: "tianji", label: "天纪 · 命理堪舆" },
                { id: "hexagrams", label: "易经六十四卦" },
                { id: "renji", label: "人纪 · 汉唐经方针灸" },
                { id: "diji", label: "地纪 · 堪舆地理" },
                { id: "bio", label: "倪师生平与语录" },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSubTab(t.id)}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                  subTab === t.id
                    ? "bg-amber-400 text-stone-950 shadow-xs"
                    : "text-stone-200 hover:bg-white/10"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 1. 天纪模块与阳宅堪舆 */}
      {subTab === "tianji" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TIANJI_MODULES.map((mod) => (
              <div
                key={mod.id}
                className="rounded-3xl border border-stone-200 bg-white p-5 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-900 text-sm font-bold text-amber-50">
                      {mod.icon}
                    </span>
                    <div>
                      <h4 className="text-base font-bold text-stone-900">{mod.name}</h4>
                      <p className="text-[11px] text-stone-500">{mod.subtitle}</p>
                    </div>
                  </div>
                  {mod.school && (
                    <span className="rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[11px] font-semibold text-amber-900">
                      {mod.school}
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">{mod.description}</p>
                <div className="space-y-2 pt-1">
                  {mod.chapters.slice(0, 3).map((ch) => (
                    <div
                      key={ch.id}
                      className="rounded-xl bg-stone-50 border border-stone-200/70 p-2.5 text-xs"
                    >
                      <div className="font-bold text-stone-800">{ch.title}</div>
                      <p className="text-[11px] text-stone-600 mt-0.5">{ch.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* 阳宅风水核心法则 */}
          <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-xs space-y-4">
            <h4 className="text-base font-bold text-stone-900">
              🧭 倪海厦《天纪·地脉道》阳宅堪舆九宫名位法则（三分命，七分运与地理改运）
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {FENGSHUI_ENTRIES.map((fs) => (
                <div
                  key={fs.id}
                  className="rounded-2xl border border-amber-900/15 bg-amber-50/30 p-3.5 space-y-1.5"
                >
                  <div className="text-xs font-bold text-amber-950">{fs.title}</div>
                  <p className="text-xs text-stone-600 leading-relaxed">{fs.description}</p>
                  <ul className="space-y-1 pt-1 text-[11px] text-stone-700">
                    {fs.keyPoints.slice(0, 3).map((kp) => (
                      <li key={kp}>• {kp}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. 易经六十四卦速查 */}
      {subTab === "hexagrams" && (
        <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-base font-bold text-stone-900">
                ☯ 倪海厦《天纪·人间道》易经六十四卦象数断事全解（共 {HEXAGRAMS.length} 卦）
              </h4>
              <p className="text-xs text-stone-500">
                支持按卦序、卦名（如 乾、坤、既济）或断事关键词检索
              </p>
            </div>
            <input
              type="text"
              value={hexSearch}
              onChange={(e) => setHexSearch(e.target.value)}
              placeholder="搜索卦名或断语（如：乾为天、升、财、婚）..."
              className="w-full sm:w-72 rounded-xl border border-stone-300 bg-stone-50 px-3 py-1.5 text-xs"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[600px] overflow-y-auto pr-1">
            {filteredHexagrams.map((hex) => (
              <div
                key={hex.number}
                className="rounded-2xl border border-stone-200 bg-stone-50/60 p-3.5 space-y-1.5 hover:border-amber-400 transition"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-amber-950">
                    第{hex.number}卦 · {hex.composition}（{hex.name}卦）
                  </span>
                  <span className="rounded bg-stone-200 px-1.5 py-0.5 text-[10px] font-semibold text-stone-700">
                    上{hex.upper}下{hex.lower}
                  </span>
                </div>
                <p className="text-xs text-stone-700 font-medium">{hex.meaning}</p>
                <p className="text-[11px] text-stone-600 leading-relaxed">
                  <strong>倪师心法：</strong>
                  {hex.niInterpretation}
                </p>
                <p className="text-[11px] text-amber-900 bg-amber-50 rounded-lg px-2 py-1">
                  <strong>占断要诀：</strong>
                  {hex.divination}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. 人纪：汉唐百方与针灸经验 */}
      {subTab === "renji" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {RENJI_MODULES.map((rm) => (
              <div
                key={rm.id}
                className="rounded-2xl border border-stone-200 bg-white p-4 shadow-2xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-stone-900">
                    {rm.icon} {rm.name}
                  </span>
                  {rm.lessons && (
                    <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                      {rm.lessons}
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-600 line-clamp-2">{rm.description}</p>
              </div>
            ))}
          </div>

          <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-base font-bold text-stone-900">
                  🌿 《人纪》汉唐百方与经方理论检索（共 {HANTANG_FORMULAS.length} 方）
                </h4>
                <p className="text-xs text-stone-500">
                  仅供中华传统医道学术研究参考，临床诊疗请遵医嘱
                </p>
              </div>
              <input
                type="text"
                value={medSearch}
                onChange={(e) => setMedSearch(e.target.value)}
                placeholder="搜索汉唐方名或适应症（如：失眠、胃、寒）..."
                className="w-full sm:w-72 rounded-xl border border-stone-300 bg-stone-50 px-3 py-1.5 text-xs"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[420px] overflow-y-auto pr-1">
              {filteredFormulas.map((f) => (
                <div
                  key={f.id}
                  className="rounded-2xl border border-stone-200 bg-stone-50/70 p-3.5 space-y-1 text-xs"
                >
                  <div className="font-bold text-amber-950">
                    汉唐-{f.id}号 · {f.name}
                  </div>
                  <p className="text-stone-700">
                    <strong>主治：</strong>
                    {f.indication}
                  </p>
                  {f.theory && (
                    <p className="text-[11px] text-stone-500 leading-relaxed">
                      <strong>医理：</strong>
                      {f.theory}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-xs space-y-3">
            <h4 className="text-base font-bold text-stone-900">
              📍 《人纪·针灸大成》临床经验配穴精选（共收录 {ACU_EXPERIENCES.length} 组）
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-80 overflow-y-auto pr-1">
              {ACU_EXPERIENCES.slice(0, 30).map((acu) => (
                <div
                  key={acu.id}
                  className="rounded-xl border border-stone-200 p-3 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-stone-900">{acu.condition}</span>
                    <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-900">
                      {acu.category}
                    </span>
                  </div>
                  <p className="text-emerald-800 font-semibold">取穴：{acu.acupoints}</p>
                  {acu.note && <p className="text-[11px] text-stone-500">{acu.note}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. 地纪 */}
      {subTab === "diji" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {DIJI_MODULES.map((mod) => (
            <div
              key={mod.id}
              className="rounded-3xl border border-stone-200 bg-white p-5 shadow-xs space-y-3"
            >
              <h4 className="text-base font-bold text-stone-900">
                {mod.icon} {mod.name} · {mod.subtitle}
              </h4>
              <p className="text-xs text-stone-600 leading-relaxed">{mod.description}</p>
              <div className="space-y-2">
                {mod.chapters.map((ch) => (
                  <div
                    key={ch.id}
                    className="rounded-xl bg-stone-50 border border-stone-200/70 p-3 text-xs space-y-1"
                  >
                    <div className="font-bold text-stone-900">{ch.title}</div>
                    <p className="text-stone-600">{ch.description}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 5. 倪师传记与经典语录 */}
      {subTab === "bio" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 rounded-3xl border border-stone-200 bg-white p-5 space-y-4">
            <h4 className="text-base font-bold text-stone-900">
              {NI_HAIXIA_BIO.name}（{NI_HAIXIA_BIO.birth} — {NI_HAIXIA_BIO.death}）·{" "}
              {NI_HAIXIA_BIO.title}
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {NI_HAIXIA_BIO.titles.map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[11px] font-semibold text-amber-900"
                >
                  {t}
                </span>
              ))}
            </div>
            <div className="space-y-2 pt-2">
              <div className="text-xs font-bold text-stone-800">生平大事年表</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {NI_HAIXIA_BIO.timeline.map((item) => (
                  <div
                    key={item.year + item.event}
                    className="rounded-xl bg-stone-50 border border-stone-200/60 p-2.5 text-xs"
                  >
                    <span className="font-mono font-bold text-amber-800 mr-1.5">
                      {item.year}
                    </span>
                    <span className="text-stone-700">{item.event}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-stone-200 bg-amber-50/40 p-5 space-y-3">
            <h4 className="text-base font-bold text-amber-950">《天纪》振聋发聩语录</h4>
            <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
              {TIANJI_QUOTES.map((q) => (
                <div
                  key={q.text}
                  className="rounded-2xl bg-white border border-amber-200/70 p-3 text-xs space-y-1 shadow-2xs"
                >
                  <p className="font-semibold text-stone-800 leading-relaxed">
                    「{q.text}」
                  </p>
                  <div className="text-[10px] text-amber-800">—— 专题：{q.topic}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
