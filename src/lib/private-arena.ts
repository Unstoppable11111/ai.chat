import type { RowDataPacket } from "mysql2/promise";
import { getDbPool } from "./db";
import type { ArenaAccount, StrategyType } from "./quant-arena/types";
import { randomUUID } from "node:crypto";
import { calculateBuyExecution, calculateSellExecution } from "./quant-arena/execution-simulator";
import { maximumDrawdown } from "./quant-arena/paper-math.mjs";

export function emptyAccounts(): ArenaAccount[] {
  return (["aggressive", "balanced", "conservative"] as StrategyType[]).map((id, index) => ({
    id, name: ["进取账户", "均衡账户", "稳健账户"][index], version: "2.0", initial_capital: 100000,
    total_equity: 100000, cash: 100000, market_value: 0, today_pnl: 0, today_pnl_pct: 0,
    total_return_pct: 0, max_drawdown_pct: 0, sharpe_ratio: 0, sortino_ratio: 0, calmar_ratio: 0,
    win_rate_pct: 0, profit_factor: 0, current_exposure_pct: 0, position_count: 0, completed_trades: 0,
    strategy_score: 0, risk_status: "SAFE", is_protection_mode: false,
    positions: [], equity_series: [], orders: [], candles: [], events: [],
    attribution: { stock_selection_pct: 0, industry_allocation_pct: 0, timing_pct: 0, position_sizing_pct: 0, market_beta_pct: 0, alpha_pct: 0 },
    risk_metrics: { volatility_pct: 0, beta: 0, var_95_pct: 0, cvar_95_pct: 0, max_single_position_pct: 0, top_industry: "暂无持仓", top_industry_pct: 0, concentration_top3_pct: 0 },
  }));
}

export async function readPrivateArena(userId: string): Promise<ArenaAccount[]> {
  const db = getDbPool();
  if (!db) throw new Error("Database unavailable");
  const [rows] = await db.execute<RowDataPacket[]>("SELECT snapshot FROM arena_snapshots WHERE user_id=?", [userId]);
  if (!rows.length) return emptyAccounts();
  return typeof rows[0].snapshot === "string" ? JSON.parse(rows[0].snapshot) : rows[0].snapshot;
}

// Creating an account is explicit. A GET never inserts, trades, or rewrites history.
export async function initializePrivateArena(userId: string) {
  const db = getDbPool();
  if (!db) throw new Error("Database unavailable");
  await db.execute("INSERT IGNORE INTO arena_snapshots (user_id,snapshot) VALUES (?,?)", [userId, JSON.stringify(emptyAccounts())]);
  return readPrivateArena(userId);
}

export type RecordedTrade={strategy:StrategyType;side:"BUY"|"SELL";code:string;price:number;quantity:number;requestKey:string};
export async function recordPaperTrade(userId:string,trade:RecordedTrade) {
  const pool=getDbPool();if(!pool)throw new Error("Database unavailable");
  const connection=await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute("INSERT IGNORE INTO arena_snapshots(user_id,snapshot) VALUES(?,?)",[userId,JSON.stringify(emptyAccounts())]);
    const [rows]=await connection.execute<RowDataPacket[]>("SELECT snapshot FROM arena_snapshots WHERE user_id=? FOR UPDATE",[userId]);
    const accounts:ArenaAccount[]=typeof rows[0].snapshot==="string"?JSON.parse(rows[0].snapshot):rows[0].snapshot;
    const [prior]=await connection.execute<RowDataPacket[]>("SELECT request_key FROM arena_requests WHERE user_id=? AND request_key=?",[userId,trade.requestKey]);
    if(prior.length){await connection.commit();return accounts;}
    const account=accounts.find(item=>item.id===trade.strategy)!;
    const date=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Shanghai"}).format(new Date());
    const timestamp=new Date().toISOString();
    const position=account.positions.find(item=>item.code===trade.code);
    let price:number,amount:number,commission:number,stampTax:number,slippage:number,pnl:number|undefined;
    if(trade.side==="BUY"){
      if(trade.quantity%100)throw new Error("买入数量必须为100的整数倍");
      const execution=calculateBuyExecution(trade.price,trade.quantity);
      if(execution.total_cash_required>account.cash)throw new Error("模拟资金不足");
      account.cash-=execution.total_cash_required;
      price=execution.execution_price;amount=execution.principal;commission=execution.commission;stampTax=0;slippage=execution.slippage;
      if(position){
        position.cost_price=(position.shares*position.cost_price+amount)/ (position.shares+trade.quantity);
        position.available_shares=position.buy_date===date?position.available_shares:position.shares;
        position.shares+=trade.quantity;position.buy_date=date;position.current_price=trade.price;
      }else account.positions.push({code:trade.code,name:trade.code,shares:trade.quantity,available_shares:0,cost_price:price,current_price:trade.price,market_value:0,weight_pct:0,pnl:0,pnl_pct:0,stop_loss_price:0,target_price:0,holding_days:0,buy_date:date,strategy_reason:"手动录入参考价的模拟记录",sector:"未分类",beta:0});
    }else{
      if(!position)throw new Error("模拟持仓不存在");
      const available=position.buy_date===date?position.available_shares:position.shares;
      if(trade.quantity>available)throw new Error("可卖数量不足，当日新增仓位不可卖出");
      if(trade.quantity%100&&trade.quantity!==position.shares)throw new Error("零股须一次卖出");
      const execution=calculateSellExecution(trade.price,trade.quantity);
      account.cash+=execution.net_cash_received;
      price=execution.execution_price;amount=execution.gross_amount;commission=execution.commission;stampTax=execution.stamp_tax;slippage=execution.slippage;
      pnl=execution.net_cash_received-position.cost_price*trade.quantity;
      position.shares-=trade.quantity;position.available_shares=available-trade.quantity;position.current_price=trade.price;
      account.positions=account.positions.filter(item=>item.shares>0);
    }
    account.cash=Math.round(account.cash*100)/100;
    account.market_value=0;
    for(const item of account.positions){item.market_value=Math.round((item.current_price||item.cost_price)*item.shares*100)/100;item.pnl=Math.round((item.market_value-item.cost_price*item.shares)*100)/100;item.pnl_pct=(item.current_price!-item.cost_price)/item.cost_price*100;account.market_value+=item.market_value;}
    account.total_equity=account.cash+account.market_value;account.total_return_pct=(account.total_equity/account.initial_capital-1)*100;
    account.current_exposure_pct=account.market_value/account.total_equity*100;account.position_count=account.positions.length;
    for(const item of account.positions)item.weight_pct=item.market_value/account.total_equity*100;
    const priorDay=[...account.equity_series].reverse().find(point=>point.date!==date)?.equity||account.initial_capital;
    account.today_pnl=account.total_equity-priorDay;account.today_pnl_pct=account.today_pnl/priorDay*100;
    account.peak_equity=Math.max(account.peak_equity||account.initial_capital,account.total_equity);
    account.max_drawdown_pct=Math.max(account.max_drawdown_pct,maximumDrawdown([account.peak_equity,account.total_equity]));
    const point={date,equity:account.total_equity,return_pct:account.total_return_pct,benchmark_pct:0,alpha_pct:account.total_return_pct,drawdown_pct:account.max_drawdown_pct};
    account.equity_series=account.equity_series.filter(item=>item.date!==date).concat(point);
    const previousCandle=account.candles?.find(item=>item.date===date);
    const openReturn=previousCandle?.open_pnl_pct??(priorDay/account.initial_capital-1)*100;
    account.candles=(account.candles||[]).filter(item=>item.date!==date).concat({date,open_pnl_pct:openReturn,high_pnl_pct:Math.max(previousCandle?.high_pnl_pct??openReturn,openReturn,account.total_return_pct),low_pnl_pct:Math.min(previousCandle?.low_pnl_pct??openReturn,openReturn,account.total_return_pct),close_pnl_pct:account.total_return_pct,equity:account.total_equity,benchmark_pct:0,alpha_pct:account.total_return_pct,events:[]});
    account.orders.unshift({id:randomUUID(),date,signal_time:timestamp,execution_time:timestamp,stock_code:trade.code,stock_name:trade.code,strategy:trade.strategy,action:trade.side,price,shares:trade.quantity,amount,commission,stamp_tax:stampTax,slippage,total_cost:commission+stampTax,score:0,reason:"手动模拟记录；参考价由用户录入，费用采用实验预设",pnl,execution_status:"FILLED"});
    account.completed_trades=account.orders.filter(order=>order.action==="SELL").length;
    await connection.execute("UPDATE arena_snapshots SET snapshot=? WHERE user_id=?",[JSON.stringify(accounts),userId]);
    await connection.execute("INSERT INTO arena_requests(user_id,request_key) VALUES(?,?)",[userId,trade.requestKey]);
    await connection.commit();return accounts;
  } catch(error){await connection.rollback();throw error;}finally{connection.release();}
}
