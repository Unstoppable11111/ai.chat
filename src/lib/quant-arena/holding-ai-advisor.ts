import { STOCK_FUNDAMENTAL_DB } from "./factor-engine";

export interface SectorItem {
  code: string;
  name: string;
  change_pct: number;
  amount?: number;
  leader_name?: string;
  leader_change?: number;
}

export interface HoldingInputForAi {
  code: string;
  name: string;
  quantity: number;
  cost_price: number;
  current_price: number;
  market_value?: number;
  pnl: number;
  pnl_pct: number;
  day_change_pct: number;
  hold_type: string;
  stop_loss_price: number;
  sector?: string;
}

export interface MarketSnapshotForAi {
  market_score?: number;
  market_state?: string;
  market_style?: string;
}

export type AiActionBadge =
  | "顺势持有"
  | "分批止盈"
  | "破位止损"
  | "逢低低吸"
  | "防守减仓"
  | "耐心观望";

export type BadgeVariant = "emerald" | "purple" | "rose" | "cyan" | "amber" | "slate";

export interface HoldingAiAdviceResult {
  badge: AiActionBadge;
  badgeVariant: BadgeVariant;
  sectorName: string;
  sectorChangePct: number;
  sectorStrength: "强势领涨" | "温和红盘" | "窄幅震荡" | "偏弱调整" | "退潮领跌";
  marketStateText: string;
  summary: string;
  detail: string;
  resonanceScore: number;
}

/**
 * 智能行业板块匹配器：优先使用基本面库，其次智能推断常见行业赛道
 */
export function resolveStockSector(code: string, name: string, userSector?: string): string {
  if (userSector && userSector.trim()) return userSector.trim();

  const cleanCode = code.replace(/^(sh|sz|bj)/i, "").trim();
  const dbProfile = STOCK_FUNDAMENTAL_DB[cleanCode];
  if (dbProfile?.sector) return dbProfile.sector;

  const n = (name || "").toLowerCase();
  if (n.includes("酒") || n.includes("茅台") || n.includes("五粮液") || n.includes("汾酒") || n.includes("泸州")) return "酿酒行业";
  if (n.includes("电") || n.includes("光伏") || n.includes("新能源") || n.includes("锂") || n.includes("时代") || n.includes("特变")) return "发电设备";
  if (n.includes("芯") || n.includes("半导体") || n.includes("微电") || n.includes("晶圆") || n.includes("中芯") || n.includes("华虹")) return "半导体";
  if (n.includes("光模块") || n.includes("cpo") || n.includes("通信") || n.includes("中兴") || n.includes("移远")) return "电子信息";
  if (n.includes("算力") || n.includes("浪潮") || n.includes("曙光") || n.includes("富士康") || n.includes("富联") || n.includes("软件")) return "电子信息";
  if (n.includes("药") || n.includes("生物") || n.includes("医疗") || n.includes("健康") || n.includes("同仁堂")) return "生物制药";
  if (n.includes("行") || n.includes("证券") || n.includes("保") || n.includes("中信") || n.includes("招商") || n.includes("财富")) return "金融行业";
  if (n.includes("车") || n.includes("比亚迪") || n.includes("长安") || n.includes("长城") || n.includes("赛力斯")) return "汽车制造";
  if (n.includes("船") || n.includes("重工") || n.includes("航母") || n.includes("中船")) return "船舶制造";
  if (n.includes("金") || n.includes("铜") || n.includes("铝") || n.includes("稀土") || n.includes("紫金")) return "有色金属";
  if (n.includes("煤") || n.includes("神华") || n.includes("陕煤")) return "煤炭行业";
  if (n.includes("房") || n.includes("地产") || n.includes("保利") || n.includes("万科") || n.includes("招商蛇口")) return "房地产";
  if (n.includes("机") || n.includes("重工") || n.includes("三一") || n.includes("中联")) return "机械行业";

  return "综合行业";
}

/**
 * 在全市场行业列表中匹配板块涨跌幅与强度
 */
export function findSectorPerformance(
  sectorName: string,
  sectorList: SectorItem[] = []
): { change_pct: number; leader_name: string; strength: HoldingAiAdviceResult["sectorStrength"] } {
  if (!sectorList.length) {
    return { change_pct: 0, leader_name: "--", strength: "窄幅震荡" };
  }

  // 模糊匹配行业板块
  const matched =
    sectorList.find((s) => s.name === sectorName) ||
    sectorList.find((s) => s.name.includes(sectorName) || sectorName.includes(s.name)) ||
    sectorList.find(
      (s) =>
        (sectorName.includes("电子") || sectorName.includes("算力") || sectorName.includes("cpo")) &&
        (s.name.includes("电子") || s.name.includes("通信"))
    );

  const changePct = matched ? matched.change_pct : 0;
  const leaderName = matched?.leader_name || "--";

  let strength: HoldingAiAdviceResult["sectorStrength"] = "窄幅震荡";
  if (changePct >= 1.5) strength = "强势领涨";
  else if (changePct > 0) strength = "温和红盘";
  else if (changePct >= -1.0) strength = "窄幅震荡";
  else if (changePct >= -2.0) strength = "偏弱调整";
  else strength = "退潮领跌";

  return { change_pct: changePct, leader_name: leaderName, strength };
}

/**
 * 结合实时大盘评分状态 + 所属板块实时强度 + 个股自身量化指标，生成持仓 AI 智投研判建议
 */
export function evaluateHoldingAiAdvice(
  holding: HoldingInputForAi,
  marketData?: MarketSnapshotForAi | null,
  sectorList: SectorItem[] = []
): HoldingAiAdviceResult {
  const score = marketData?.market_score ?? 58;
  const marketState = marketData?.market_state || "震荡蓄势";
  const marketStyle = marketData?.market_style || "均衡";

  const resolvedSector = resolveStockSector(holding.code, holding.name, holding.sector);
  const sectorPerf = findSectorPerformance(resolvedSector, sectorList);
  const sectorChangePct = sectorPerf.change_pct;
  const sectorStrength = sectorPerf.strength;

  const pnlPct = Number.isFinite(holding.pnl_pct) ? holding.pnl_pct : 0;
  const currentPrice = holding.current_price > 0 ? holding.current_price : holding.cost_price;
  const stopLoss = holding.stop_loss_price > 0 ? holding.stop_loss_price : Number((holding.cost_price * 0.92).toFixed(2));
  const isStopLossTriggered = currentPrice > 0 && currentPrice < stopLoss;
  const isNearStopLoss = currentPrice > 0 && currentPrice <= stopLoss * 1.025;
  const holdType = holding.hold_type || "core";

  const marketSign = sectorChangePct >= 0 ? `+${sectorChangePct.toFixed(2)}%` : `${sectorChangePct.toFixed(2)}%`;
  const marketStateText = `大盘${score}分(${marketState}) · ${resolvedSector}板块(${marketSign}·${sectorStrength})`;

  // ==========================================
  // 1. 破位止损判定（最高风控优先级）
  // ==========================================
  if (isStopLossTriggered || (pnlPct <= -9 && score < 55)) {
    return {
      badge: "破位止损",
      badgeVariant: "rose",
      sectorName: resolvedSector,
      sectorChangePct,
      sectorStrength,
      marketStateText,
      resonanceScore: 18,
      summary: `现价已击穿动态止损线(¥${stopLoss.toFixed(2)})，风控红线报警，建议严格止损减仓。`,
      detail: `大盘当前处于【${marketState}】(${score}分)，所属【${resolvedSector}】板块日内强度为【${sectorStrength}】(${marketSign})。现价已破动态止损线(¥${stopLoss.toFixed(2)})，累计浮亏 ${pnlPct.toFixed(2)}%。触发严苛量化风控保护，切忌逆势死扛，建议市价分批减仓或离场，锁死单边风险敞口。`,
    };
  }

  // ==========================================
  // 2. 高位分批止盈判定（保住胜利果实）
  // ==========================================
  if (pnlPct >= 16 || (pnlPct >= 10 && (score < 50 || sectorStrength === "退潮领跌" || sectorStrength === "偏弱调整"))) {
    return {
      badge: "分批止盈",
      badgeVariant: "purple",
      sectorName: resolvedSector,
      sectorChangePct,
      sectorStrength,
      marketStateText,
      resonanceScore: 88,
      summary: `持仓浮盈+${pnlPct.toFixed(1)}%收益丰厚，所属板块出现分歧，建议逢高兑现部分利润。`,
      detail: `大盘评分 ${score} 分(${marketState})，所属【${resolvedSector}】日内表现 ${marketSign}。该标的累计浮盈已达 +${pnlPct.toFixed(2)}%，处于高位收获期。为防范主力资金冲高兑现引发收益大幅回撤，建议逢高减仓 30%~50% 锁定战果，剩余仓位止损线上移至成本线无风险护航。`,
    };
  }

  // ==========================================
  // 3. 顺势持有待涨（主线与大盘共振）
  // ==========================================
  if (
    (score >= 58 && (sectorStrength === "强势领涨" || sectorStrength === "温和红盘") && pnlPct >= 0) ||
    (pnlPct >= 3.5 && !isNearStopLoss)
  ) {
    return {
      badge: "顺势持有",
      badgeVariant: "emerald",
      sectorName: resolvedSector,
      sectorChangePct,
      sectorStrength,
      marketStateText,
      resonanceScore: 94,
      summary: `大盘向好叠加【${resolvedSector}】板块共振领涨，量价齐升处于主升浪，建议顺势持有。`,
      detail: `市场多头情绪健康(${score}分·${marketState})，风格侧重【${marketStyle}】。所属【${resolvedSector}】板块资金聚集明显(${marketSign}·${sectorStrength})。标的运行于动态止损位(¥${stopLoss.toFixed(2)})上方，主线共振动量充沛，建议保持持仓耐性跟踪主升浪，让利润顺势奔跑。`,
    };
  }

  // ==========================================
  // 4. 逢低低吸 / 均线回踩回补
  // ==========================================
  if (
    score >= 55 &&
    (sectorStrength === "强势领涨" || sectorStrength === "温和红盘" || sectorStrength === "窄幅震荡") &&
    pnlPct >= -5 &&
    pnlPct < 0 &&
    !isNearStopLoss &&
    (holdType === "core" || holdType === "trend")
  ) {
    return {
      badge: "逢低低吸",
      badgeVariant: "cyan",
      sectorName: resolvedSector,
      sectorChangePct,
      sectorStrength,
      marketStateText,
      resonanceScore: 78,
      summary: `大盘企稳且板块具备中长期景气度，个股良性回踩支撑，可逢低分批低吸。`,
      detail: `大盘处于【${marketState}】(${score}分)，所属【${resolvedSector}】板块中枢平稳(${marketSign})。持仓标的回踩属于主升趋势中的良性洗盘阶段，距离止损底线仍具备安全缓冲空间。针对${holdType === "core" ? "核心底仓" : "趋势标的"}，建议在关键均线支撑位分批挂单低吸回补，摊平成本。`,
    };
  }

  // ==========================================
  // 5. 弱势防守减仓（控水降杠杆）
  // ==========================================
  if (score < 50 && (sectorStrength === "退潮领跌" || sectorStrength === "偏弱调整" || isNearStopLoss || pnlPct < -4.5)) {
    return {
      badge: "防守减仓",
      badgeVariant: "amber",
      sectorName: resolvedSector,
      sectorChangePct,
      sectorStrength,
      marketStateText,
      resonanceScore: 32,
      summary: `大盘弱势承压且所属板块资金流出，个股贴近止损线，建议主动防守减半仓。`,
      detail: `大盘处于弱势调整区间(${score}分·${marketState})，两市交投谨慎；所属【${resolvedSector}】板块遭遇主力资金净流出(${marketSign})。当前持仓贴近动态止损红线(¥${stopLoss.toFixed(2)})，系统性回撤风险偏高。建议主动将该标的仓位下调至半仓以下，保留现金耐心等待右侧止跌反转。`,
    };
  }

  // ==========================================
  // 6. 耐心观望（中性平衡整理）
  // ==========================================
  return {
    badge: "耐心观望",
    badgeVariant: "slate",
    sectorName: resolvedSector,
    sectorChangePct,
    sectorStrength,
    marketStateText,
    resonanceScore: 56,
    summary: `大盘与板块多空处于中性平衡期，个股在正常箱体波动，保持底线思维多看少动。`,
    detail: `大盘维持【${marketState}】(${score}分)，所属【${resolvedSector}】板块日内窄幅拉锯(${marketSign})。持仓标的处于正常波动缓冲区间内，当前未出现破位或放量突破信号。建议遵守交易计划多看少动，以动态止损线 ¥${stopLoss.toFixed(2)} 为风控底线保持耐心跟踪观察。`,
  };
}
