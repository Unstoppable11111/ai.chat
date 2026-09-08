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
  const lots = Math.floor(rawShares / 100);
  return Math.max(100, lots * 100);
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
    slippage: parseFloat((principal * A_SHARE_COST_MODEL.slippage_rate).toFixed(2)),
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
    slippage: parseFloat((grossAmount * A_SHARE_COST_MODEL.slippage_rate).toFixed(2)),
    net_cash_received: netCashReceived,
  };
}

/**
 * 执行买入模拟撮合 (严格执行 T+1 规则，当日买入 available_shares = 0)
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
    decision_trace,
  } = params;

  if (account.is_protection_mode) {
    return { success: false, error: "账户处于保护模式 (PROTECTION MODE)，锁定开仓" };
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
      stop_loss_price: parseFloat((exec.execution_price * 0.95).toFixed(2)),
      target_price: parseFloat((exec.execution_price * 1.15).toFixed(2)),
      holding_days: 1,
      buy_date: date_str,
      strategy_reason: reason,
      sector,
      beta,
    });
  }

  // 记录真实订单
  const order: TradeOrder = {
    id: `ord-${account.id}-${date_str}-${stock_code}-${Date.now()}`,
    date: date_str,
    signal_time: `${date_str} 15:00:00`,
    execution_time: `${date_str} ${time_str}`,
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
    reason,
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
