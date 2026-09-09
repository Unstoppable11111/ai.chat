import { ArenaAccount, ArenaPosition, TradeOrder, DecisionTrace } from "./types";

export const A_SHARE_COST_MODEL = {
  commission_rate: 0.00025, // 万2.5佣金
  min_commission: 5.0,     // 最低5元
  stamp_tax_rate: 0.0005,  // 印花税 (仅卖出收取千0.5)
  slippage_rate: 0.0002,   // 预估滑点 (买入上浮0.02%，卖出下浮0.02%)
};

/**
 * 校验并规整为 A 股 100 股整数倍 (一手起买)
 */
export function normalizeLotShares(rawShares: number): number {
  if (!Number.isFinite(rawShares) || rawShares <= 0) return 0;
  return Math.floor(rawShares / 100) * 100;
}

/**
 * 计算买入实际成交费用与成交价格 (含滑点与佣金)
 */
export function calculateBuyExecution(nominalPrice: number, shares: number) {
  const executionPrice = parseFloat((nominalPrice * (1 + A_SHARE_COST_MODEL.slippage_rate)).toFixed(2));
  const principal = executionPrice * shares;
  const rawCommission = principal * A_SHARE_COST_MODEL.commission_rate;
  const commission = Math.max(A_SHARE_COST_MODEL.min_commission, parseFloat(rawCommission.toFixed(2)));
  const totalCost = parseFloat((principal + commission).toFixed(2));

  return {
    execution_price: executionPrice,
    principal,
    commission,
    stamp_tax: 0,
    slippage: parseFloat(((executionPrice - nominalPrice) * shares).toFixed(2)),
    total_cash_required: totalCost,
  };
}

/**
 * 计算卖出实际回收资金与扣减税费 (含滑点、佣金与千分之0.5印花税)
 */
export function calculateSellExecution(nominalPrice: number, shares: number) {
  const executionPrice = parseFloat((nominalPrice * (1 - A_SHARE_COST_MODEL.slippage_rate)).toFixed(2));
  const grossAmount = executionPrice * shares;
  const rawCommission = grossAmount * A_SHARE_COST_MODEL.commission_rate;
  const commission = Math.max(A_SHARE_COST_MODEL.min_commission, parseFloat(rawCommission.toFixed(2)));
  const stampTax = parseFloat((grossAmount * A_SHARE_COST_MODEL.stamp_tax_rate).toFixed(2));
  const netCashReceived = parseFloat((grossAmount - commission - stampTax).toFixed(2));

  return {
    execution_price: executionPrice,
    gross_amount: grossAmount,
    commission,
    stamp_tax: stampTax,
    slippage: parseFloat(((nominalPrice - executionPrice) * shares).toFixed(2)),
    net_cash_received: netCashReceived,
  };
}

/**
 * 执行买入模拟撮合 (严格执行 T+1 规则，当日买入 available_shares = 0；支持超短打板开板与未开板撮合规则)
 */
export function executeBuy(
  account: ArenaAccount,
  params: {
    stock_code: string;
    stock_name: string;
    nominal_price: number;
    target_weight_pct: number;
    date_str: string;
    time_str: string;
    score: number;
    reason: string;
    sector: string;
    beta: number;
    is_limit_up_order?: boolean;
    has_opened_limit?: boolean;
    open_limit_time?: string;
    decision_trace?: DecisionTrace;
  }
): { success: boolean; error?: string; order?: TradeOrder } {
  const {
    stock_code,
    stock_name,
    nominal_price,
    target_weight_pct,
    date_str,
    time_str,
    score,
    reason,
    sector,
    beta,
    is_limit_up_order,
    has_opened_limit,
    open_limit_time,
    decision_trace,
  } = params;

  if (account.is_protection_mode) {
    return { success: false, error: "账户处于保护模式 (PROTECTION MODE)，锁定开仓" };
  }

  // 超短打板/排板专属铁律：买入涨停板若全天一字未开板，默认无换手成交机会，判定为未买入
  if (is_limit_up_order && !has_opened_limit) {
    const unfillOrder: TradeOrder = {
      id: `ord-unfill-${account.id}-${date_str}-${stock_code}-${Date.now()}`,
      date: date_str,
      signal_time: `${date_str} 09:15:00`,
      execution_time: `${date_str} 15:00:00 (收盘废单)`,
      stock_code,
      stock_name,
      strategy: account.id,
      action: "BUY",
      price: nominal_price,
      shares: 0,
      amount: 0,
      commission: 0,
      stamp_tax: 0,
      slippage: 0,
      total_cost: 0,
      score,
      reason: `【打板未成交】全天一字封死未开板，前方巨量封单无法挂入，按超短纪律收盘自动撤单，资金原路保留`,
      is_limit_up_order: true,
      has_opened_limit: false,
      execution_status: "UNFILLED",
      unfilled_reason: "全天一字板未开板，无换手回封撮合点，按A股真实规则默认未买入",
      decision_trace,
    };
    account.orders.unshift(unfillOrder);
    return {
      success: false,
      error: "全天一字板未开板，排单无法成交，按A股真实规则默认未买入",
      order: unfillOrder,
    };
  }

  // 计算目标买入资金与股数
  const targetCapital = account.total_equity * (target_weight_pct / 100);
  const rawShares = Math.floor(targetCapital / nominal_price);
  const shares = normalizeLotShares(rawShares);

  const exec = calculateBuyExecution(nominal_price, shares);

  if (account.cash < exec.total_cash_required) {
    return { success: false, error: `可用资金不足 (需 ¥${exec.total_cash_required}, 现有现金 ¥${account.cash})` };
  }

  // 扣减现金
  account.cash = parseFloat((account.cash - exec.total_cash_required).toFixed(2));

  // 针对不同策略风格，配置差异化的止盈与止损比例
  // 激进策略（做最强龙头股，快进快出，放大止盈至 +18%~25%，放大止损至 -7% 容忍剧烈洗盘）
  // 均衡策略（GARP中军，止盈 +10%，止损 -4.5%）
  // 保守策略（红利低波，止盈 +6%，止损 -3.0%）
  let stopLossRatio = 0.95;
  let targetRatio = 1.15;
  if (account.id === "aggressive") {
    stopLossRatio = 0.93; // -7.0% 宽幅止损
    targetRatio = 1.20;   // +20.0% 主升浪连板止盈
  } else if (account.id === "balanced") {
    stopLossRatio = 0.955; // -4.5%
    targetRatio = 1.10;    // +10.0%
  } else if (account.id === "conservative") {
    stopLossRatio = 0.97;  // -3.0%
    targetRatio = 1.06;    // +6.0%
  }

  const finalReason = is_limit_up_order && has_opened_limit
    ? `${reason} (于 ${open_limit_time || "09:42"} 放量开板换手回封，排板挂单撮合成交)`
    : reason;

  // 检查已有持仓
  const existingPos = account.positions.find((p) => p.code === stock_code);
  if (existingPos) {
    const totalShares = existingPos.shares + shares;
    const totalCost = existingPos.shares * existingPos.cost_price + exec.principal;
    existingPos.cost_price = parseFloat((totalCost / totalShares).toFixed(2));
    existingPos.shares = totalShares;
    // T+1 规则：今天新买入的 shares 不增加当天的 available_shares
    existingPos.market_value = Math.round(totalShares * exec.execution_price);
  } else {
    account.positions.push({
      code: stock_code,
      name: stock_name,
      shares,
      available_shares: 0, // T+1 铁律：买入当日可卖股数为 0
      cost_price: exec.execution_price,
      current_price: exec.execution_price,
      market_value: Math.round(shares * exec.execution_price),
      weight_pct: parseFloat(((shares * exec.execution_price / account.total_equity) * 100).toFixed(1)),
      pnl: 0,
      pnl_pct: 0,
      stop_loss_price: parseFloat((exec.execution_price * stopLossRatio).toFixed(2)),
      target_price: parseFloat((exec.execution_price * targetRatio).toFixed(2)),
      holding_days: 1,
      buy_date: date_str,
      strategy_reason: finalReason,
      sector,
      beta,
    });
  }

  // 记录真实订单
  const order: TradeOrder = {
    id: `ord-${account.id}-${date_str}-${stock_code}-${Date.now()}`,
    date: date_str,
    signal_time: `${date_str} 09:15:00`,
    execution_time: is_limit_up_order && open_limit_time ? `${date_str} ${open_limit_time}` : `${date_str} ${time_str}`,
    stock_code,
    stock_name,
    strategy: account.id,
    action: "BUY",
    price: exec.execution_price,
    shares,
    amount: exec.principal,
    commission: exec.commission,
    stamp_tax: exec.stamp_tax,
    slippage: exec.slippage,
    total_cost: exec.total_cash_required,
    score,
    reason: finalReason,
    is_limit_up_order: !!is_limit_up_order,
    has_opened_limit: !!has_opened_limit,
    open_limit_time: open_limit_time,
    execution_status: "FILLED",
    decision_trace,
  };

  account.orders.unshift(order);
  return { success: true, order };
}

/**
 * 执行卖出模拟撮合 (严格校验 T+1 可用持仓限制与千分之0.5印花税)
 */
export function executeSell(
  account: ArenaAccount,
  params: {
    stock_code: string;
    nominal_price: number;
    shares_to_sell: number;
    date_str: string;
    time_str: string;
    reason: string;
    exit_reason: string;
    decision_trace?: DecisionTrace;
  }
): { success: boolean; error?: string; order?: TradeOrder } {
  const {
    stock_code,
    nominal_price,
    shares_to_sell,
    date_str,
    time_str,
    reason,
    exit_reason,
    decision_trace,
  } = params;

  const posIndex = account.positions.findIndex((p) => p.code === stock_code);
  if (posIndex === -1) {
    return { success: false, error: `未持有该标的 ${stock_code}` };
  }

  const pos = account.positions[posIndex];
  if (pos.available_shares < shares_to_sell) {
    return {
      success: false,
      error: `触发 T+1 交易限制：今日可用股数仅为 ${pos.available_shares} 股（当日买入股份不可卖出）`,
    };
  }

  const exec = calculateSellExecution(nominal_price, shares_to_sell);
  const costBasis = pos.cost_price * shares_to_sell;
  const pnl = parseFloat((exec.net_cash_received - costBasis).toFixed(2));
  const pnlPct = parseFloat(((pnl / costBasis) * 100).toFixed(2));

  // 回收净现金
  account.cash = parseFloat((account.cash + exec.net_cash_received).toFixed(2));

  // 扣减持仓
  pos.shares -= shares_to_sell;
  pos.available_shares -= shares_to_sell;
  if (pos.shares <= 0) {
    account.positions.splice(posIndex, 1);
  } else {
    pos.market_value = Math.round(pos.shares * exec.execution_price);
    pos.weight_pct = parseFloat(((pos.market_value / account.total_equity) * 100).toFixed(1));
  }

  // 记录真实成交订单
  const order: TradeOrder = {
    id: `ord-sell-${account.id}-${date_str}-${stock_code}-${Date.now()}`,
    date: date_str,
    signal_time: `${date_str} 15:00:00`,
    execution_time: `${date_str} ${time_str}`,
    stock_code,
    stock_name: pos.name,
    strategy: account.id,
    action: "SELL",
    price: exec.execution_price,
    shares: shares_to_sell,
    amount: exec.gross_amount,
    commission: exec.commission,
    stamp_tax: exec.stamp_tax,
    slippage: exec.slippage,
    total_cost: parseFloat((exec.commission + exec.stamp_tax).toFixed(2)),
    score: 0,
    reason,
    pnl,
    pnl_pct: pnlPct,
    holding_days: pos.holding_days,
    exit_reason,
    decision_trace,
  };

  account.orders.unshift(order);
  return { success: true, order };
}
