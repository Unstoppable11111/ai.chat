import {
  classifyAShareBoard,
  computeStockTechnicals,
} from "@/lib/quant-arena/swing-rules";
import { STOCK_FUNDAMENTAL_DB } from "@/lib/quant-arena/factor-engine";
import { fetchStockDailyKline } from "@/lib/quotes-service";
import { resolveStockSector } from "@/lib/quant-arena/holding-ai-advisor";
import {
  addRollingWatchItem,
  listUserRollingPool,
  settleUserRollingPool,
  type EnrollCandidateInput,
  type RollingPoolItem,
} from "@/lib/rolling-pool-db";
import { getUserHoldings } from "@/lib/portfolio-db";
import { getShanghaiDateStr } from "@/lib/trading-hours";

export interface ScreenedCandidate extends EnrollCandidateInput {
  board: string;
  sector: string;
  price: number;
  change_pct: number;
  amount_yi: number;
  composite_score: number;
  pos_52w_pct: number | null;
  ret_5d_pct: number | null;
  above_ma20: boolean;
  tech_keywords_hit: string[];
  score_note: string;
  thesis: string;
}

export interface ScreenerRunSummary {
  trade_date: string;
  scanned_count: number;
  qualified_count: number;
  candidates: ScreenedCandidate[];
}

const TECH_NAME_OR_SECTOR_WORDS = [
  "科技", "电子", "半导", "芯片", "集成", "电路", "微电", "封装", "存储",
  "算力", "数据", "云", "服务器", "通信", "光模块", "光电", "激光", "传感",
  "软件", "智能", "AI", "人工", "机器", "自动", "精密", "工业", "信息",
  "网络", "信创", "PCB", "电路板", "载板", "元件", "材料", "仪表", "数控",
  "中际", "新易盛", "天孚", "深南", "沪电", "胜宏", "生益", "协创", "寒武",
  "海光", "中科", "浪潮", "紫光", "北方", "中微", "长电", "通富", "韦尔",
  "兆易", "立讯", "歌尔", "蓝思", "科大", "润泽", "宝信", "金山", "中控",
  "汇川", "迈瑞", "联影", "利通", "工业富联", "工业",
];

const NON_TECH_EXCLUDE_WORDS = [
  "银行", "证券", "保险", "信托", "地产", "置业", "物业", "水泥",
  "煤炭", "煤业", "石油", "石化", "黄金", "矿业", "有色", "钢铁",
  "白酒", "啤酒", "酿酒", "食品", "调味", "乳业", "牧业", "猪",
  "养殖", "医药", "中药", "药业", "百货", "超市", "航空", "机场",
  "港口", "高速", "电力", "水电", "燃气", "纺织", "服饰",
];

interface RawMarketActiveRow {
  code: string;
  name: string;
  price: number;
  change_pct: number;
  amount_yi: number;
}

async function fetchActiveMarketRows(limit = 100): Promise<RawMarketActiveRow[]> {
  // 通道1：新浪全市场按成交额降序快照（稳定且无代理冲突）
  try {
    const pages = Math.ceil(Math.min(200, Math.max(40, limit)) / 100);
    const list: RawMarketActiveRow[] = [];
    for (let page = 1; page <= pages; page++) {
      const res = await fetch(
        `https://vip.stock.finance.sina.com.cn/quotes_service/api/json_v2.php/Market_Center.getHQNodeData?page=${page}&num=100&sort=amount&asc=0&node=hs_a`,
        {
          headers: { "User-Agent": "Mozilla/5.0", Referer: "https://finance.sina.com.cn" },
          cache: "no-store",
          signal: AbortSignal.timeout(5000),
        }
      );
      if (!res.ok) continue;
      const arr = (await res.json()) as Array<{
        code?: string;
        symbol?: string;
        name?: string;
        trade?: string | number;
        changepercent?: string | number;
        amount?: string | number;
      }>;
      if (!Array.isArray(arr)) continue;
      for (const item of arr) {
        const cleanCode = String(item.code || item.symbol || "").replace(/^(sh|sz|bj)/i, "").trim();
        const name = String(item.name || "").trim();
        const price = Number(item.trade) || 0;
        const chg = Number(item.changepercent) || 0;
        const amtYi = Number(item.amount || 0) / 1e8;
        if (/^\d{6}$/.test(cleanCode) && name && price > 0) {
          list.push({ code: cleanCode, name, price, change_pct: chg, amount_yi: amtYi });
        }
      }
    }
    if (list.length > 0) return list.slice(0, limit);
  } catch (err) {
    console.warn("[RollingScreener] 新浪活跃股抓取降级:", err);
  }

  // 通道2：东财全市场成交额排行兜底
  try {
    const res = await fetch(
      `https://push2.eastmoney.com/api/qt/clist/get?pn=1&pz=${Math.min(150, limit)}&po=1&np=1&fltt=2&invt=2&fid=f6&fs=m:0+t:6,m:0+t:80,m:1+t:2&fields=f12,f14,f2,f3,f6`,
      {
        headers: { "User-Agent": "Mozilla/5.0" },
        cache: "no-store",
        signal: AbortSignal.timeout(5000),
      }
    );
    if (res.ok) {
      const json = (await res.json()) as {
        data?: { diff?: Array<{ f12?: string; f14?: string; f2?: number; f3?: number; f6?: number }> };
      };
      const diff = json?.data?.diff || [];
      return diff
        .map((d) => ({
          code: String(d.f12 || "").trim(),
          name: String(d.f14 || "").trim(),
          price: Number(d.f2) || 0,
          change_pct: Number(d.f3) || 0,
          amount_yi: Number(d.f6 || 0) / 1e8,
        }))
        .filter((d) => /^\d{6}$/.test(d.code) && d.name && d.price > 0);
    }
  } catch {
    // ignore
  }
  return [];
}

async function runWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let idx = 0;
  async function next() {
    while (idx < items.length) {
      const cur = idx++;
      results[cur] = await worker(items[cur]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, next));
  return results;
}

/**
 * 沪深主板 + 创业板科技成长股盘后量化初筛器
 * 严格排除科创板、北交所、ETF 与 ST，并过滤非科技传统行业。
 */
export async function runSwingScreener(options?: {
  sampleLimit?: number;
  minAmountYi?: number;
  maxResults?: number;
  tradeDateStr?: string;
}): Promise<ScreenerRunSummary> {
  const sampleLimit = options?.sampleLimit ?? 100;
  const minAmountYi = options?.minAmountYi ?? 3.0;
  const maxResults = options?.maxResults ?? 12;
  const tradeDateStr = options?.tradeDateStr || getShanghaiDateStr();

  const rawRows = await fetchActiveMarketRows(sampleLimit);

  // 第 1 层硬过滤：仅保留沪深主板与创业板、成交额 >= minAmountYi、非ST、排除明显非科技传统行业
  const preFiltered = rawRows.filter((row) => {
    const board = classifyAShareBoard(row.code, row.name);
    if (!board.allowed) return false;
    if (row.amount_yi < minAmountYi) return false;
    const dbProfile = STOCK_FUNDAMENTAL_DB[row.code];
    const sector = resolveStockSector(row.code, row.name, dbProfile?.sector);
    const hay = `${row.name} ${sector}`;
    if (NON_TECH_EXCLUDE_WORDS.some((w) => hay.includes(w)) && !dbProfile) return false;
    const hitsTech =
      Boolean(dbProfile) ||
      TECH_NAME_OR_SECTOR_WORDS.some((w) => hay.includes(w));
    return hitsTech;
  });

  const targetPool = preFiltered.slice(0, 48);

  // 第 2 层：受控并发拉取 250 日前复权日K，计算放量比与涨停基因
  const evaluated = await runWithConcurrency<RawMarketActiveRow, ScreenedCandidate | null>(
    targetPool,
    5,
    async (row): Promise<ScreenedCandidate | null> => {
    const bars = await fetchStockDailyKline(row.code, 260);
    if (bars.length < 30) return null;

    const tech = computeStockTechnicals(bars, row.code, {
      price: row.price,
      change_pct: row.change_pct,
    });

    const vr = tech.vol_ratio_5_20 ?? 0;
    const limitCnt = tech.limit_up_count_1y ?? 0;
    const pos52w = tech.pos_52w_pct ?? 50;
    const ret5d = tech.ret_5d_pct ?? 0;

    // 核心量价门槛：5日/前20日温和以上放量 >= 1.35x，且近1年至少具备1次涨停基因
    if (vr < 1.35 || limitCnt < 1) return null;
    // 防高位接盘：52周极高位置且5日连续暴涨 >= 18% 不纳入推荐
    if (pos52w >= 88 && ret5d >= 18) return null;

    const board = classifyAShareBoard(row.code, row.name);
    const dbProfile = STOCK_FUNDAMENTAL_DB[row.code];
    const sector = resolveStockSector(row.code, row.name, dbProfile?.sector);
    const hay = `${row.name} ${sector}`;
    const hits = TECH_NAME_OR_SECTOR_WORDS.filter((w) => hay.includes(w)).slice(0, 4);

    // 透明度打分（护城河/赛道属性 0~100 + 交易结构 0~100）
    let moatScore = 62 + Math.min(20, hits.length * 5);
    if (dbProfile) {
      if ((dbProfile.roe_pct ?? 0) >= 15) moatScore += 8;
      if ((dbProfile.revenue_growth_pct ?? 0) >= 20) moatScore += 8;
    }
    moatScore = Math.min(98, Number(moatScore.toFixed(1)));

    const volScore = vr >= 1.6 && vr <= 3.0 ? 34 : vr > 3.0 ? 28 : 24;
    const luScore = limitCnt >= 5 ? 26 : limitCnt >= 2 ? 20 : 14;
    const posScore = pos52w < 45 ? 25 : pos52w < 75 ? 18 : 8;
    const maScore = tech.above_ma20 ? 12 : 4;
    const structureScore = Math.min(98, Number((volScore + luScore + posScore + maScore).toFixed(1)));
    const composite = Number((0.45 * moatScore + 0.55 * structureScore).toFixed(1));

    return {
      code: row.code,
      name: row.name,
      board: board.board,
      sector,
      price: row.price,
      change_pct: row.change_pct,
      amount_yi: Number(row.amount_yi.toFixed(2)),
      entry_ref_price: row.price,
      buy_low: tech.suggested_buy_low,
      buy_high: tech.suggested_buy_high,
      breakout_price: tech.suggested_breakout,
      invalid_price: tech.suggested_invalid,
      vol_ratio_5_20: tech.vol_ratio_5_20,
      limit_up_count_1y: limitCnt,
      moat_score: moatScore,
      structure_score: structureScore,
      composite_score: composite,
      pos_52w_pct: tech.pos_52w_pct,
      ret_5d_pct: tech.ret_5d_pct,
      above_ma20: tech.above_ma20,
      tech_keywords_hit: hits,
      score_note: `量比${vr.toFixed(2)}x · 近1年${limitCnt}次涨停 · 52W分位${pos52w.toFixed(0)}%`,
      thesis: `${sector}核心活跃标的，近5日相对前20日放量 ${vr.toFixed(2)}x，近1年 ${limitCnt} 次涨停基因，${tech.above_ma20 ? "运行于MA20上方多头结构" : "处于均线蓄势修复区"}。`,
    };
  });

  const candidates = evaluated
    .filter((item): item is ScreenedCandidate => item !== null)
    .sort((a, b) => b.composite_score - a.composite_score)
    .slice(0, maxResults);

  return {
    trade_date: tradeDateStr,
    scanned_count: rawRows.length,
    qualified_count: candidates.length,
    candidates,
  };
}

/**
 * 为指定账户执行一次盘后 5 日观察池结算 + 新推荐入池
 */
export async function settleAndEnrollForUser(
  userId: string,
  screenerResult: ScreenerRunSummary,
  quotesMap: Record<string, { current_price: number; change_pct: number } | undefined>,
  dailyAddCount = 3
): Promise<{
  expiredToday: RollingPoolItem[];
  invalidatedToday: RollingPoolItem[];
  enrolledToday: RollingPoolItem[];
  activeAfter: RollingPoolItem[];
}> {
  const settled = await settleUserRollingPool(userId, screenerResult.trade_date, quotesMap);

  const holdings = await getUserHoldings(userId);
  const holdingCodes = new Set(holdings.map((h) => h.stock_code));
  const poolAfterSettle = await listUserRollingPool(userId);
  const activeCodes = new Set(poolAfterSettle.active.map((a) => a.stock_code));

  const enrolledToday: RollingPoolItem[] = [];
  for (const cand of screenerResult.candidates) {
    if (enrolledToday.length >= dailyAddCount) break;
    if (holdingCodes.has(cand.code) || activeCodes.has(cand.code)) continue;
    const added = await addRollingWatchItem(userId, cand, screenerResult.trade_date, 12);
    if (added) {
      enrolledToday.push(added);
      activeCodes.add(cand.code);
    }
  }

  const finalPool = await listUserRollingPool(userId);
  return {
    expiredToday: settled.expiredToday,
    invalidatedToday: settled.invalidatedToday,
    enrolledToday,
    activeAfter: finalPool.active,
  };
}
