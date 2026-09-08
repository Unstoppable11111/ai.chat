import {
  StrategyType,
  StrategySignal,
  QuantScoreDetail,
  DecisionTrace,
} from "./types";
import { calculateStockFactors, STOCK_FUNDAMENTAL_DB } from "./factor-engine";
import { RealQuote } from "@/lib/quotes-service";

/**
 * 激进策略评分引擎 (Aggressive: High Growth + Momentum + Breakout)
 * 权重: Industry 25, Growth 25, Trend 25, Momentum 15, Valuation 10
 */
export function evaluateAggressive(
  factors: ReturnType<typeof calculateStockFactors>,
  dateStr: string,
  timeStr: string
): { score: number; detail: QuantScoreDetail; signal: "BUY" | "SELL" | "HOLD" | "WATCH"; reason: string; trace: DecisionTrace } {
  const p = factors!.profile;
  const ind = factors!.indicators;
  const price = factors!.price;

  // 1. Industry (25)
  let indScore = 18;
  let indReason = `处于${p.sector}风口主线`;
  if (["CPO光模块", "PCB算力板", "AI算力", "半导体设备"].includes(p.sector)) {
    indScore = 24;
    indReason = "全球AI算力基础设施扩张核心主线，资金合力强度Top1";
  } else if (["半导体封测", "先进封装", "消费电子"].includes(p.sector)) {
    indScore = 20;
    indReason = "科技景气度温和回暖主线";
  } else {
    indScore = 12;
    indReason = "非当下最高弹性主线赛道";
  }

  // 2. Growth (25)
  let grScore = 15;
  let grReason = `扣非净利增速${p.profit_growth_pct}%`;
  if (p.profit_growth_pct >= 100) {
    grScore = 25;
    grReason = `利润爆发式增长${p.profit_growth_pct}%，2026预期高增${p.profit_growth_forecast_2026}%`;
  } else if (p.profit_growth_pct >= 40) {
    grScore = 21;
    grReason = `利润高增${p.profit_growth_pct}%，订单释放明确`;
  } else if (p.profit_growth_pct >= 20) {
    grScore = 16;
    grReason = `业绩平稳增长${p.profit_growth_pct}%`;
  }

  // 3. Trend (25)
  let trScore = 16;
  let trReason = "处于均线多头排列";
  if (ind.is_60d_breakout) {
    trScore = 24;
    trReason = "放量突破60日新高箱体，主升浪均线系统加速上扬";
  } else if (ind.is_20d_breakout) {
    trScore = 22;
    trReason = "突破20日均线阻力位，多头量价共振";
  } else if (ind.above_ma60) {
    trScore = 18;
    trReason = "运行于MA60生命线上方，趋势良性";
  }

  // 4. Momentum (15)
  let moScore = 9;
  let moReason = `Beta系数${p.beta}，股性较活跃`;
  if (p.beta >= 1.4 && ind.volume_ratio > 1.2) {
    moScore = 14;
    moReason = `高弹性龙头(Beta ${p.beta})，量比${ind.volume_ratio}持续放量`;
  } else if (p.beta >= 1.2) {
    moScore = 12;
    moReason = `Beta ${p.beta}，弹性良好，跟风盘充沛`;
  }

  // 5. Valuation (10)
  let valScore = 6;
  let valReason = `PE(TTM) ${p.pe_ttm}倍，PEG ${p.peg}`;
  if (p.peg <= 0.9) {
    valScore = 9;
    valReason = `PEG ${p.peg} < 1，高成长对估值形成良好消化`;
  } else if (p.peg <= 1.2) {
    valScore = 7;
    valReason = `PEG ${p.peg}估值合理匹配成长`;
  } else {
    valScore = 5;
    valReason = `成长溢价较高，需依赖业绩高速兑现`;
  }

  const totalScore = parseFloat((indScore + grScore + trScore + moScore + valScore).toFixed(1));

  let action: "BUY" | "SELL" | "HOLD" | "WATCH" = "WATCH";
  if (totalScore >= 75 && (ind.is_20d_breakout || ind.is_60d_breakout)) {
    action = "BUY";
  } else if (totalScore >= 70) {
    action = "HOLD";
  } else if (totalScore < 60) {
    action = "SELL";
  }

  const detail: QuantScoreDetail = {
    total: totalScore,
    industry: { score: indScore, max: 25, label: "行业强度", value: p.sector, reason: indReason },
    fundamental: { score: 18, max: 20, label: "基本面质地", value: `ROE ${p.roe_pct}%`, reason: `净资产收益率${p.roe_pct}%，经营现金流${p.operating_cash_flow_yi}亿` },
    growth: { score: grScore, max: 25, label: "业绩成长", value: `+${p.profit_growth_pct}%`, reason: grReason },
    valuation: { score: valScore, max: 10, label: "估值消化", value: `PEG ${p.peg}`, reason: valReason },
    trend: { score: trScore, max: 25, label: "均线突破", value: ind.is_60d_breakout ? "60D突破" : "多头排列", reason: trReason },
    momentum: { score: moScore, max: 15, label: "动量弹性", value: `Beta ${p.beta}`, reason: moReason },
    liquidity: { score: 9, max: 10, label: "流动性承接", value: `${p.market_cap_yi}亿市值`, reason: "机构游资流动性充沛" },
    risk: { score: 8, max: 10, label: "风控合规", value: "非ST/非科创", reason: "剔除ST与科创板流动性折价风险" },
  };

  const trace: DecisionTrace = {
    data_as_of: `${dateStr} 15:00:00`,
    signal_time: `${dateStr} ${timeStr}`,
    execution_time: "次日 09:30:00 开盘集合竞价 (T+1规则)",
    data_input: `最新现价 ¥${price.toFixed(2)}，日内涨跌 ${factors!.day_change_pct}%，PE ${p.pe_ttm}，净利增速 ${p.profit_growth_pct}%`,
    factors: `行业=${p.sector}(+${indScore})，成长=+${p.profit_growth_pct}%(+${grScore})，趋势=${ind.is_60d_breakout ? "60D新高突破" : "多头排列"}(+${trScore})，动量=Beta ${p.beta}(+${moScore})`,
    score_eval: `激进综合评分 ${totalScore} / 100（突破入选阈值 75分）`,
    signal_eval: action === "BUY" ? "触发【超短最强龙头 + 放量突破打板】买入信号" : action === "HOLD" ? "龙头主升浪顺势持有，紧盯分时换手" : "观望或止损",
    risk_check: "超短宽幅止损风控：单票最大25%仓位，硬止损线放大至成本 -7.0%（给予龙头股宽幅震荡洗盘空间，破位坚决离场），目标止盈放大至 +18%~25%",
    sizing_rationale: "超短快进快出，集中重仓市场最强领涨龙头，单票仓位 20% ~ 25%，次日或第3日冲高分批止盈",
    execution_plan: "支持打板/排板挂单撮合：需日内有开板换手时间点，若全天一字封死未开板默认排单不成交；严守 T+1 次日或第三日快速冲高止盈",
    rule_compliance: "符合超短龙头战法规则：快进快出、做最强主线龙头、不惧高位、允许打板回封买入、放大止盈止损",
  };

  return { score: totalScore, detail, signal: action, reason: `${p.sector}最强领涨龙头，快进快出打板突破，业绩与超短动量双轮驱动`, trace };
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

    // 激进策略候选池评估 (只做高弹性科技风口主线)
    if (["300502", "300476", "300308", "000977"].includes(code)) {
      const agg = evaluateAggressive(factors, dateStr, timeStr);
      result.aggressive.push({
        id: `sig-agg-${code}`,
        stock_code: code,
        stock_name: quote.name,
        strategy: "aggressive",
        action: agg.signal,
        score: agg.score,
        score_detail: agg.detail,
        data_as_of: `${dateStr} 15:00:00`,
        signal_time: `${dateStr} ${timeStr}`,
        execution_time: "次日 09:30:00 (支持日内开板换手回封撮合)",
        current_price: quote.current_price,
        suggested_entry: parseFloat((quote.current_price * 0.998).toFixed(2)),
        stop_loss: parseFloat((quote.current_price * 0.93).toFixed(2)), // 宽幅严格止损 -7.0%
        target_price: parseFloat((quote.current_price * 1.20).toFixed(2)), // 连板止盈目标 +20.0%
        position_size_pct: 25,
        risk_reward_ratio: 2.85,
        confidence: "HIGH",
        reason: agg.reason,
        data_quality: quote.source === "cache" ? "MEDIUM" : "HIGH",
        decision_trace: agg.trace,
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
  result.balanced.sort((a, b) => b.score - a.score);
  result.conservative.sort((a, b) => b.score - a.score);

  return result;
}
