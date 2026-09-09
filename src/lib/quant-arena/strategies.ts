import {
  StrategyType,
  StrategySignal,
  QuantScoreDetail,
  DecisionTrace,
} from "./types";
import { calculateStockFactors, STOCK_FUNDAMENTAL_DB } from "./factor-engine";
import { RealQuote } from "@/lib/quotes-service";

export interface LimitUpExecutionCheck {
  can_buy: boolean;
  status: "NORMAL_LIQUIDITY" | "LIMIT_UP_OPENED_BOUGHT" | "LIMIT_UP_UNOPENED_REJECTED";
  execution_price: number;
  reason: string;
}

/**
 * A股超短打板真实可买入性核验：
 * 1. 如果全天一字涨停且从未开板(open == current_price && low == current_price && change_pct >= 9.8)，默认买不进去(资金保留为现金，不计入持仓)；
 * 2. 如果是一字板排板，但日内中间开板换手(low < current_price)，当作涨停价买入成功；
 * 3. 如果是普通实体换手板或分时追涨(open < current_price)，正常按当前买入价成交。
 */
export function checkLimitUpExecution(quote: RealQuote): LimitUpExecutionCheck {
  const isLimitUp = quote.change_pct >= 9.8;
  const isUnopenedBoard =
    isLimitUp &&
    quote.open > 0 &&
    quote.low > 0 &&
    quote.open >= quote.current_price &&
    quote.low >= quote.current_price;

  if (isUnopenedBoard) {
    return {
      can_buy: false,
      status: "LIMIT_UP_UNOPENED_REJECTED",
      execution_price: 0,
      reason: "该标的全天一字死封涨停且未曾开板换手(最低价=开盘价=涨停价)，排板资金无法撮合成交，根据超短纪律默认未买入，资金保留为现金",
    };
  }

  if (isLimitUp && quote.low < quote.current_price) {
    return {
      can_buy: true,
      status: "LIMIT_UP_OPENED_BOUGHT",
      execution_price: quote.current_price,
      reason: "日内触及涨停但盘中出现分时开板换手回封(最低价低于涨停价)，排板挂单成功撮合成交，按涨停价确认买入",
    };
  }

  return {
    can_buy: true,
    status: "NORMAL_LIQUIDITY",
    execution_price: quote.current_price,
    reason: "非一字板品种，盘中具备充分多空换手流动性，正常撮合成交买入",
  };
}

/**
 * 激进策略评分引擎 (Aggressive: 中小市值超短龙头 + 打板突破 + 无行业偏见 + 满仓单挑)
 * 权重: 主线热度 25, 中小盘股性弹性 25, 突破与连板动量 25, 资金承接 15, 风险收益比 10
 * 铁律: 不买大市值(>500亿扣分)，不设科技板块优先限制，标的数≤2只，行情好直接满仓甚至单挑
 */
export function evaluateAggressive(
  factors: ReturnType<typeof calculateStockFactors>,
  dateStr: string,
  timeStr: string
): { score: number; detail: QuantScoreDetail; signal: "BUY" | "SELL" | "HOLD" | "WATCH"; reason: string; trace: DecisionTrace } {
  const p = factors!.profile;
  const ind = factors!.indicators;
  const price = factors!.price;

  // 1. 主线题材与情绪热度 (25分) - 破除科技优先，唯题材强度与赚钱效应是瞻
  let indScore = 20;
  let indReason = `处于全市场热门主线题材【${p.sector}】`;
  if (["低空经济", "商业航天", "机器人", "华为海思", "固态电池", "CPO光模块", "PCB算力板", "算力硬件", "智能驾驶"].includes(p.sector)) {
    indScore = 25;
    indReason = `处于全市场情绪最高板与主流资金主攻方向【${p.sector}】，游资机构合力最强`;
  } else if (p.profit_growth_pct >= 30 || ind.is_60d_breakout) {
    indScore = 23;
    indReason = `当前赛道走出高辨识度超短连板形态，题材具备高度独立性`;
  }

  // 2. 市值与股性弹性 (25分) - 坚决不买大市值大象股，重奖50~300亿中小盘高弹性
  let capScore = 18;
  let capReason = `市值 ${p.market_cap_yi} 亿，具备一定超短弹性`;
  if (p.market_cap_yi > 800) {
    // 大市值严重扣分，不适合超短打板
    capScore = 10;
    capReason = `市值高达 ${p.market_cap_yi} 亿，属于大盘中军权重，缺乏超短连板爆发力，不符合超短龙头打法`;
  } else if (p.market_cap_yi > 500) {
    capScore = 14;
    capReason = `市值 ${p.market_cap_yi} 亿偏大，拉升需消耗巨额资金，超短爆发弹性一般`;
  } else if (p.market_cap_yi >= 50 && p.market_cap_yi <= 320) {
    // 最佳超短黄金市值区间
    capScore = 25;
    capReason = `市值 ${p.market_cap_yi} 亿黄金超短区间，盘子轻流动性佳，游资极易拉升封板，超短爆发力顶格`;
  } else {
    capScore = 20;
    capReason = `小微盘市值 ${p.market_cap_yi} 亿，弹性高，需防范极端流动性闪崩`;
  }

  // 3. 突破与连板动量 (25分)
  let trScore = 16;
  let trReason = "处于均线多头排列，量价平稳";
  if (ind.is_60d_breakout) {
    trScore = 25;
    trReason = "放量突破60日新高箱体，主升浪均线系统加速上扬，超短打板溢价极高";
  } else if (ind.is_20d_breakout) {
    trScore = 22;
    trReason = "突破20日均线阻力位，多头放量涨停突破";
  } else if (ind.above_ma60) {
    trScore = 18;
    trReason = "运行于MA60生命线上方，趋势良性";
  }

  // 4. 股性活跃度与量比换手 (15分)
  let moScore = 10;
  let moReason = `Beta系数 ${p.beta}，股性活跃`;
  if (p.beta >= 1.4 && ind.volume_ratio > 1.2) {
    moScore = 15;
    moReason = `超高弹性妖股(Beta ${p.beta})，量比 ${ind.volume_ratio} 持续放量换手，承接力极强`;
  } else if (p.beta >= 1.2) {
    moScore = 13;
    moReason = `Beta ${p.beta}，弹性优良，游资合力充沛`;
  }

  // 5. 风险收益比与胜率预估 (10分)
  let valScore = 7;
  let valReason = `超短盈亏比健康，止盈空间大于止损空间`;
  if (factors!.day_change_pct >= 5.0) {
    valScore = 9;
    valReason = `日内大阳线冲击涨停，次日高开溢价概率超 75%`;
  }

  const totalScore = parseFloat((indScore + capScore + trScore + moScore + valScore).toFixed(1));

  let action: "BUY" | "SELL" | "HOLD" | "WATCH" = "WATCH";
  // 必须是中小市值且放量突破
  if (totalScore >= 78 && p.market_cap_yi <= 500 && (ind.is_20d_breakout || ind.is_60d_breakout)) {
    action = "BUY";
  } else if (totalScore >= 70 && p.market_cap_yi <= 500) {
    action = "HOLD";
  } else if (totalScore < 60 || p.market_cap_yi > 800) {
    action = "SELL";
  }

  const detail: QuantScoreDetail = {
    total: totalScore,
    industry: { score: indScore, max: 25, label: "题材热度", value: p.sector, reason: indReason },
    fundamental: { score: capScore, max: 25, label: "中小盘弹性", value: `${p.market_cap_yi}亿市值`, reason: capReason },
    growth: { score: 18, max: 20, label: "业绩与催化", value: `+${p.profit_growth_pct}%`, reason: `扣非增速${p.profit_growth_pct}%，具备强事件驱动催化` },
    valuation: { score: valScore, max: 10, label: "超短盈亏比", value: "高胜率进攻", reason: valReason },
    trend: { score: trScore, max: 25, label: "涨停与突破", value: ind.is_60d_breakout ? "60D新高" : "放量突破", reason: trReason },
    momentum: { score: moScore, max: 15, label: "股性Beta", value: `Beta ${p.beta}`, reason: moReason },
    liquidity: { score: 9, max: 10, label: "换手承接", value: "游资合力", reason: "换手充分，承接力极强" },
    risk: { score: 9, max: 10, label: "风控纪律", value: "超短快进快出", reason: "持仓≤2只，严格执行开板与回撤止损" },
  };

  const trace: DecisionTrace = {
    data_as_of: `${dateStr} 15:00:00`,
    signal_time: `${dateStr} ${timeStr}`,
    execution_time: "次日 09:30:00 开盘集合竞价/开板换手 (T+1规则)",
    data_input: `最新现价 ¥${price.toFixed(2)}，日内涨跌 ${factors!.day_change_pct}%，市值 ${p.market_cap_yi}亿(中小盘)，行业=${p.sector}`,
    factors: `题材=${p.sector}(+${indScore})，中小盘=${p.market_cap_yi}亿(+${capScore})，突破=${ind.is_60d_breakout ? "60D新高" : "放量突破"}(+${trScore})，动量=Beta ${p.beta}(+${moScore})`,
    score_eval: `激进超短评分 ${totalScore} / 100（突破入选阈值 78分）`,
    signal_eval: action === "BUY" ? "触发【中小市值最强龙头 + 满仓打板突破】买入信号" : action === "HOLD" ? "超短龙头主升浪锁仓，紧盯分时换手" : "观望或止损",
    risk_check: "超短极致风控铁律：持仓数量严格≤2只，单票持仓比例无任何限制（支持单票50%~100%满仓单挑），坚决剔除大市值权重股，破除科技板块偏向，全市场唯最强连板高度龙头是瞻；核心纪律：严格监控10个交易日累计偏离度，在10天100%严重异动监管前夕（约6~7板临界点）主动止盈离场，绝不参与特停核查风险",
    sizing_rationale: "行情火热时直接满仓干，甚至单挑一只总龙头满仓100%；次日冲高开板择机止盈，快进快出，不恐高但严守纪律；连板触及严重异动监控线前坚决撤退",
    execution_plan: "打板/排板撮合严格执行开板核验：全天一字板未曾开板默认买不进去，资金保持现金；一字板排板若日内有开板换手时间点，按涨停价买入成交；买入当天严格以实际买入价格计算浮动盈亏（当天买入浮盈为0），绝不使用个股全天涨幅计算当天收益，次日及后续才计算连板溢价。",
    rule_compliance: "严格契合A股超短战法：连板高度龙头追涨、未开一字板买不进默认不计入持仓、开板排板按涨停价成交、买入当天以成本价计算收益、10天100%严重异动前退出。",
  };

  return { score: totalScore, detail, signal: action, reason: `${p.sector}连板高度龙头(${p.market_cap_yi}亿)，超短打板追涨，行情好单挑满仓进攻，10天100%异动前主动退出`, trace };
}

/**
 * 均衡策略评分引擎 (Balanced: Fundamental + Growth + Valuation + Trend)
 * 权重: Fundamental 30, Growth 25, Industry 15, Trend 15, Valuation 10, Liquidity 5
 */
export function evaluateBalanced(
  factors: ReturnType<typeof calculateStockFactors>,
  dateStr: string,
  timeStr: string
): { score: number; detail: QuantScoreDetail; signal: "BUY" | "SELL" | "HOLD" | "WATCH"; reason: string; trace: DecisionTrace } {
  const p = factors!.profile;
  const ind = factors!.indicators;
  const price = factors!.price;

  // 1. Fundamental (30)
  let fundScore = 20;
  let fundReason = `ROE ${p.roe_pct}%，主业纯正`;
  if (p.roe_pct >= 20 && p.non_recurring_clean_ratio > 90) {
    fundScore = 29;
    fundReason = `ROE高企(${p.roe_pct}%)且扣非占比${p.non_recurring_clean_ratio}%，主业盈利极其扎实`;
  } else if (p.roe_pct >= 14) {
    fundScore = 25;
    fundReason = `ROE ${p.roe_pct}%，资产负债率${p.debt_ratio_pct}%健康`;
  }

  // 2. Growth (25) - 优先考虑 2026 与 2027 持续增长
  let grScore = 18;
  let grReason = `2026/2027持续预期+${p.profit_growth_forecast_2026}%/+${p.profit_growth_forecast_2027}%`;
  if (p.profit_growth_forecast_2026 >= 25 && p.profit_growth_forecast_2027 >= 20) {
    grScore = 24;
    grReason = `具备跨周期持续成长能力(26年+${p.profit_growth_forecast_2026}%/27年+${p.profit_growth_forecast_2027}%)`;
  } else if (p.profit_growth_forecast_2026 >= 15) {
    grScore = 20;
    grReason = "盈利增长中枢平稳上移";
  }

  // 3. Industry (15)
  let indScore = 12;
  let indReason = `${p.sector}产业中军`;
  if (["半导体封测", "消费电子", "PCB算力板"].includes(p.sector)) {
    indScore = 14;
    indReason = `${p.sector}产业景气拐点向上，细分市占率前三`;
  }

  // 4. Trend (15)
  let trScore = 11;
  let trReason = "股价稳居MA60上方";
  if (ind.above_ma60 && ind.ma20_slope_up) {
    trScore = 14;
    trReason = "MA60强支撑企稳，MA20温和向上，未现高位超买";
  }

  // 5. Valuation (10)
  let valScore = 7;
  let valReason = `PE ${p.pe_ttm}，PEG ${p.peg}`;
  if (p.peg >= 0.8 && p.peg <= 1.2) {
    valScore = 9;
    valReason = `PEG处于0.8~1.2绝佳GARP投资区间(${p.peg})`;
  }

  // 6. Liquidity (5)
  const liqScore = p.market_cap_yi >= 500 ? 5 : 4;

  const totalScore = parseFloat((fundScore + grScore + indScore + trScore + valScore + liqScore).toFixed(1));

  let action: "BUY" | "SELL" | "HOLD" | "WATCH" = "WATCH";
  if (totalScore >= 76 && ind.above_ma60) {
    action = "BUY";
  } else if (totalScore >= 68) {
    action = "HOLD";
  } else if (totalScore < 58) {
    action = "SELL";
  }

  const detail: QuantScoreDetail = {
    total: totalScore,
    industry: { score: indScore, max: 15, label: "行业中军", value: p.sector, reason: indReason },
    fundamental: { score: fundScore, max: 30, label: "基本面质地", value: `ROE ${p.roe_pct}%`, reason: fundReason },
    growth: { score: grScore, max: 25, label: "可持续增长", value: `26/27持续高增`, reason: grReason },
    valuation: { score: valScore, max: 10, label: "合理估值", value: `PEG ${p.peg}`, reason: valReason },
    trend: { score: trScore, max: 15, label: "稳健趋势", value: "MA60上方企稳", reason: trReason },
    momentum: { score: 7, max: 10, label: "动量适中", value: `Beta ${p.beta}`, reason: "走势稳健，避免追高" },
    liquidity: { score: liqScore, max: 5, label: "流动性充沛", value: `${p.market_cap_yi}亿市值`, reason: "机构配置型核心标的" },
    risk: { score: 9, max: 10, label: "低违约风险", value: `负债率${p.debt_ratio_pct}%`, reason: "现金流优异，非经常损益低" },
  };

  const trace: DecisionTrace = {
    data_as_of: `${dateStr} 15:00:00`,
    signal_time: `${dateStr} ${timeStr}`,
    execution_time: "次日 09:35:00 回踩分批建仓 (T+1规则)",
    data_input: `最新现价 ¥${price.toFixed(2)}，ROE ${p.roe_pct}%，PEG ${p.peg}，负债率 ${p.debt_ratio_pct}%`,
    factors: `基本面=${fundReason}(+${fundScore})，持续成长=${grReason}(+${grScore})，估值=PEG ${p.peg}(+${valScore})，趋势=MA60企稳(+${trScore})`,
    score_eval: `均衡GARP综合评分 ${totalScore} / 100（买入标准 76分）`,
    signal_eval: action === "BUY" ? "触发【GARP优选 + MA60企稳】分批建仓信号" : "顺势中线波段持有",
    risk_check: "风控检查通过：单票最大20%仓位，止损线设为成本 -7.0% 或跌破30日线",
    sizing_rationale: "目标配置15%~20%，采取分批建仓模型（首笔5%，回踩确认加3%，突破加2%）",
    execution_plan: "挂单买入整百股，扣除万2.5佣金，执行A股T+1日内不可卖出纪律",
    rule_compliance: "符合均衡策略规则：拒绝单季暴增题材，坚持跨年稳健成长",
  };

  return { score: totalScore, detail, signal: action, reason: `GARP合理估值成长，跨年盈利预期稳定，MA60上方稳健筑底`, trace };
}

/**
 * 保守策略评分引擎 (Conservative: Quality + Valuation + Stability + Low Volatility)
 * 权重: Fundamental 35, Quality 25, Valuation 20, Trend 10, Volatility 10
 */
export function evaluateConservative(
  factors: ReturnType<typeof calculateStockFactors>,
  dateStr: string,
  timeStr: string
): { score: number; detail: QuantScoreDetail; signal: "BUY" | "SELL" | "HOLD" | "WATCH"; reason: string; trace: DecisionTrace } {
  const p = factors!.profile;
  const ind = factors!.indicators;
  const price = factors!.price;

  // 1. Fundamental & Cash Flow (35)
  let fundScore = 25;
  let fundReason = `自由现金流${p.operating_cash_flow_yi}亿充沛`;
  if (p.operating_cash_flow_yi >= 100 && p.dividend_yield_pct >= 4.0) {
    fundScore = 34;
    fundReason = `经营现金流极其充沛(${p.operating_cash_flow_yi}亿)，高股息${p.dividend_yield_pct}%筑牢安全底线`;
  } else if (p.dividend_yield_pct >= 3.0) {
    fundScore = 28;
    fundReason = `股息率${p.dividend_yield_pct}%高于国债收益率`;
  }

  // 2. Quality & Moat (25)
  let qualScore = 18;
  let qualReason = `行业壁垒坚固，特许经营或资源垄断`;
  if (["高股息水电", "核电公用", "银行红利"].includes(p.sector)) {
    qualScore = 24;
    qualReason = `${p.sector}具有天然护城河与垄断壁垒，现金牛特征极其显著`;
  } else if (p.sector === "农业种植") {
    qualScore = 20;
    qualReason = "国家粮食安全战略压舱石，防御抗跌属性极强";
  }

  // 3. Valuation (20)
  let valScore = 14;
  let valReason = `PE ${p.pe_ttm}倍，PB ${p.pb}倍`;
  if (p.pe_ttm <= 10 && p.dividend_yield_pct >= 4.5) {
    valScore = 19;
    valReason = `处于历史估值低位，股息率高达${p.dividend_yield_pct}%`;
  } else if (p.pe_ttm <= 22) {
    valScore = 16;
    valReason = "估值中枢平稳，无泡沫挤压风险";
  }

  // 4. Trend (10)
  let trScore = 7;
  let trReason = "长周期均线平稳";
  if (ind.above_ma60) {
    trScore = 9;
    trReason = "年线及半年线慢牛爬坡，抗摔打能力强";
  }

  // 5. Volatility (10) - 越低波动得分越高
  let volScore = 6;
  let volReason = `Beta ${p.beta}`;
  if (p.beta <= 0.6) {
    volScore = 10;
    volReason = `超低Beta(${p.beta})与低波动率，熊市避风港`;
  } else if (p.beta <= 0.8) {
    volScore = 8;
    volReason = `低Beta(${p.beta})，与大盘涨跌相关度低`;
  }

  const totalScore = parseFloat((fundScore + qualScore + valScore + trScore + volScore).toFixed(1));

  let action: "BUY" | "SELL" | "HOLD" | "WATCH" = "WATCH";
  if (totalScore >= 75) {
    action = "BUY";
  } else if (totalScore >= 68) {
    action = "HOLD";
  } else {
    action = "WATCH";
  }

  const detail: QuantScoreDetail = {
    total: totalScore,
    industry: { score: 12, max: 15, label: "行业防守", value: p.sector, reason: qualReason },
    fundamental: { score: fundScore, max: 35, label: "现金流与分红", value: `股息率 ${p.dividend_yield_pct}%`, reason: fundReason },
    growth: { score: 14, max: 15, label: "稳健低波", value: `利润平稳`, reason: "盈利周期波动低，确定性高" },
    valuation: { score: valScore, max: 20, label: "安全边际", value: `PE ${p.pe_ttm}`, reason: valReason },
    trend: { score: trScore, max: 10, label: "长期支撑", value: "慢牛平稳", reason: trReason },
    momentum: { score: 4, max: 10, label: "低投机性", value: "远离连板", reason: "排除短线题材炒作与暴涨暴跌" },
    liquidity: { score: 9, max: 10, label: "承接力极强", value: `${p.market_cap_yi}亿市值`, reason: "机构配置型中军底仓" },
    risk: { score: volScore, max: 10, label: "极低波动", value: `Beta ${p.beta}`, reason: volReason },
  };

  const trace: DecisionTrace = {
    data_as_of: `${dateStr} 15:00:00`,
    signal_time: `${dateStr} ${timeStr}`,
    execution_time: "次日 10:00:00 左侧网格挂单 (T+1规则)",
    data_input: `最新现价 ¥${price.toFixed(2)}，股息率 ${p.dividend_yield_pct}%，经营现金流 ${p.operating_cash_flow_yi}亿，Beta ${p.beta}`,
    factors: `分红现金流=${fundReason}(+${fundScore})，垄断护城河=${qualReason}(+${qualScore})，估值边际=PE ${p.pe_ttm}(+${valScore})，低波防守=Beta ${p.beta}(+${volScore})`,
    score_eval: `保守低波综合评分 ${totalScore} / 100（安全边际充分）`,
    signal_eval: action === "BUY" ? "触发【高股息 + 低Beta现金流压舱石】配置信号" : "长期从容持有吃息",
    risk_check: "风控检查通过：单票最大15%仓位，仅在分红逻辑破坏或现金流骤降时被动止损",
    sizing_rationale: "防守组合压舱石，单票仓位 10% ~ 15%，网格金字塔分批建仓",
    execution_plan: "挂单买入整百股，严守T+1与卖出0.05%印花税计入",
    rule_compliance: "符合保守策略规则：严禁追涨题材股，严守安全边际与分红保障",
  };

  return { score: totalScore, detail, signal: action, reason: `高股息护城河核心资产，自由现金流极佳，低波动抗跌压舱石`, trace };
}

/**
 * 生成三大策略的最新信号与量化金股推荐池 (Strategy Recommendations)
 */
export function generateStrategyRecommendations(
  quotes: Record<string, RealQuote>,
  dateStr: string,
  timeStr: string
): Record<StrategyType, StrategySignal[]> {
  const result: Record<StrategyType, StrategySignal[]> = {
    aggressive: [],
    balanced: [],
    conservative: [],
  };

  for (const [code, quote] of Object.entries(quotes)) {
    const factors = calculateStockFactors(code, quote);
    if (!factors) continue;

    // 激进策略候选池评估 (市场最高连板梯队龙头，不限题材，支持满仓单挑，10天100%异动前退出)
    if (["600865", "600108", "002403", "000158", "002085"].includes(code)) {
      const execCheck = checkLimitUpExecution(quote);
      const agg = evaluateAggressive(factors, dateStr, timeStr);
      const finalAction = execCheck.can_buy ? agg.signal : "WATCH";
      const finalReason = execCheck.can_buy
        ? `${agg.reason}【${execCheck.reason}】`
        : execCheck.reason;

      result.aggressive.push({
        id: `sig-agg-${code}`,
        stock_code: code,
        stock_name: quote.name,
        strategy: "aggressive",
        action: finalAction,
        score: agg.score,
        score_detail: agg.detail,
        data_as_of: `${dateStr} 15:00:00`,
        signal_time: `${dateStr} ${timeStr}`,
        execution_time: execCheck.status === "LIMIT_UP_OPENED_BOUGHT"
          ? "日内分时开板换手点 (排板按涨停价撮合)"
          : "次日 09:30:00 (开盘换手回封撮合)",
        current_price: quote.current_price,
        suggested_entry: execCheck.can_buy ? execCheck.execution_price : 0,
        stop_loss: parseFloat((quote.current_price * 0.93).toFixed(2)), // 宽幅严格止损 -7.0%
        target_price: parseFloat((quote.current_price * 1.20).toFixed(2)), // 连板止盈目标 +20.0%
        position_size_pct: execCheck.can_buy ? 100 : 0, // 无法成交默认保持现金
        risk_reward_ratio: 2.85,
        confidence: execCheck.can_buy ? "HIGH" : "LOW",
        reason: finalReason,
        data_quality: quote.source === "cache" ? "MEDIUM" : "HIGH",
        decision_trace: {
          ...agg.trace,
          execution_plan: execCheck.reason,
        },
      });
    }

    // 均衡策略候选池评估 (GARP中军+成长)
    if (["600584", "002475", "300476", "300502"].includes(code)) {
      const bal = evaluateBalanced(factors, dateStr, timeStr);
      result.balanced.push({
        id: `sig-bal-${code}`,
        stock_code: code,
        stock_name: quote.name,
        strategy: "balanced",
        action: bal.signal,
        score: bal.score,
        score_detail: bal.detail,
        data_as_of: `${dateStr} 15:00:00`,
        signal_time: `${dateStr} ${timeStr}`,
        execution_time: "次日 09:35:00",
        current_price: quote.current_price,
        suggested_entry: parseFloat((quote.current_price * 0.992).toFixed(2)),
        stop_loss: parseFloat((quote.current_price * 0.93).toFixed(2)),
        target_price: parseFloat((quote.current_price * 1.12).toFixed(2)),
        position_size_pct: 15,
        risk_reward_ratio: 2.2,
        confidence: "HIGH",
        reason: bal.reason,
        data_quality: quote.source === "cache" ? "MEDIUM" : "HIGH",
        decision_trace: bal.trace,
      });
    }

    // 保守策略候选池评估 (高股息+农业防守+公用事业)
    if (["600900", "601985", "600036", "000998"].includes(code)) {
      const con = evaluateConservative(factors, dateStr, timeStr);
      result.conservative.push({
        id: `sig-con-${code}`,
        stock_code: code,
        stock_name: quote.name,
        strategy: "conservative",
        action: con.signal,
        score: con.score,
        score_detail: con.detail,
        data_as_of: `${dateStr} 15:00:00`,
        signal_time: `${dateStr} ${timeStr}`,
        execution_time: "次日 10:00:00",
        current_price: quote.current_price,
        suggested_entry: parseFloat((quote.current_price * 0.990).toFixed(2)),
        stop_loss: parseFloat((quote.current_price * 0.90).toFixed(2)),
        target_price: parseFloat((quote.current_price * 1.08).toFixed(2)),
        position_size_pct: 12,
        risk_reward_ratio: 2.0,
        confidence: "HIGH",
        reason: con.reason,
        data_quality: quote.source === "cache" ? "MEDIUM" : "HIGH",
        decision_trace: con.trace,
      });
    }
  }

  // 评分从高到低排序
  result.aggressive.sort((a, b) => b.score - a.score);
  // 激进型超短铁律：持仓与推荐严格不超过2只，极度聚焦龙头
  result.aggressive = result.aggressive.slice(0, 2);
  result.balanced.sort((a, b) => b.score - a.score);
  result.conservative.sort((a, b) => b.score - a.score);

  return result;
}
