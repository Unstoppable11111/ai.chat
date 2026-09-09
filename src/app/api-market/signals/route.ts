import { NextResponse } from "next/server";
import { requestOwner } from "@/lib/server-security";
import { readPrivateArena } from "@/lib/private-arena";
export async function GET(request: Request) {
  const userId = await requestOwner(request);
  if (!userId) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  const style = new URL(request.url).searchParams.get("account") || "aggressive";
  if (!["aggressive","balanced","conservative"].includes(style)) return NextResponse.json({ error:"账户类型无效" },{status:400});
  try {
    const accounts = (await readPrivateArena(userId)).map(account=>({account_id:account.id,account_name:account.name,style_desc:"个人模拟账户",initial_capital:account.initial_capital,total_equity:account.total_equity,cash:account.cash,market_value:account.market_value,total_pnl:account.total_equity-account.initial_capital,total_pnl_pct:account.total_return_pct,today_pnl:account.today_pnl,today_pnl_pct:account.today_pnl_pct,position_ratio_pct:account.current_exposure_pct,win_rate:account.win_rate_pct,profit_loss_ratio:account.profit_factor,completed_trades:account.completed_trades||0,max_drawdown_pct:account.max_drawdown_pct,start_date:account.equity_series[0]?.date||"",rules_desc:"暂无经过验证的策略信号",holdings:account.positions,candles:account.candles||[],events:account.events||[]}));
    const selected=accounts.find(account=>account.account_id===style);
    return NextResponse.json({success:true,today_picks:[],history:[],stats:null,accounts,active_account:style,paper_account:selected,pnl_kline:selected?.candles||[],trade_events:selected?.events||[]},{headers:{"Cache-Control":"private, no-store"}});
  } catch { return NextResponse.json({error:"账户数据暂不可用"},{status:503}); }
}
