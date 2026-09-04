"""A股量化决策系统 FastAPI 微服务

提供：
1. 盘中 5 分钟市场状态与决策卡查询接口
2. 用户持仓实时诊断与加减仓风控决策接口
3. 盘中 5 分钟自动轮询后台任务（仅在交易日 09:30-11:30, 13:00-15:00 触发）
"""
from __future__ import annotations

import asyncio
from contextlib import asynccontextmanager
from datetime import datetime, time as dtime
from pathlib import Path
from typing import Any, List, Optional

import pandas as pd
from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from loguru import logger

import sys
ROOT = Path(__file__).parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.context import RunContext
from data.storage.database import Database
from data.providers.tencent import TencentProvider
from data.providers.sina import SinaProvider
from utils.trading_calendar import TradingCalendar
from market.score import MarketScorer
from sector.mainline import MainlineEngine


# -------------------------------------------------------------
# 状态缓存与单例
# -------------------------------------------------------------
class SystemState:
    def __init__(self):
        self.ctx: Optional[RunContext] = None
        self.db: Optional[Database] = None
        self.tencent: Optional[TencentProvider] = None
        self.sina: Optional[SinaProvider] = None
        self.calendar: Optional[TradingCalendar] = None
        self.market_scorer: Optional[MarketScorer] = None
        self.mainline_engine: Optional[MainlineEngine] = None
        
        # 内存缓存的最新分析
        self.latest_market_data: dict[str, Any] = {}
        self.last_update_time: str = ""
        self.is_updating: bool = False

state = SystemState()


def is_in_trading_hours() -> bool:
    """判断当前时间是否处于 A 股交易时段"""
    now = datetime.now()
    t = now.time()
    # 上午 09:25 ~ 11:31，下午 12:59 ~ 15:05
    morning = (t >= dtime(9, 25)) and (t <= dtime(11, 31))
    afternoon = (t >= dtime(12, 59)) and (t <= dtime(15, 5))
    return morning or afternoon


async def background_market_scheduler():
    """盘中 5 分钟轮询任务（仅在交易时段唤醒）"""
    logger.info("启动盘中 5 分钟市场轮询后台调度器...")
    while True:
        try:
            today_str = datetime.now().strftime("%Y-%m-%d")
            is_trade_day = state.calendar.is_trading_day(today_str) if state.calendar else True
            
            if is_trade_day and is_in_trading_hours():
                logger.info("处于交易时段，触发盘中 5 分钟行情推演...")
                await refresh_market_snapshot()
            else:
                logger.debug(f"非交易时段 ({datetime.now().strftime('%H:%M:%S')})，调度器待机...")
        except Exception as e:
            logger.error(f"后台调度器异常: {e}")
            
        # 每 300 秒（5分钟）循环一次
        await asyncio.sleep(300)


async def refresh_market_snapshot():
    """抓取核心行情并推演大盘与决策卡"""
    if state.is_updating:
        return
    state.is_updating = True
    try:
        now_dt = datetime.now()
        date_str = now_dt.strftime("%Y-%m-%d")
        time_str = now_dt.strftime("%H:%M:%S")
        
        # 1. 查询指数行情
        index_codes = ["000001", "399001", "399006"]
        idx_df = pd.DataFrame()
        if state.tencent:
            idx_df = state.tencent.get_index_quotes(index_codes)
        if idx_df.empty and state.sina:
            idx_df = state.sina.get_index_quotes(index_codes)
            
        # 2. 调用市场综合评分器
        analysis = state.market_scorer.analyze(
            index_df=idx_df,
            all_stocks_df=None,
            sector_df=None,
            date=date_str,
            mode="intraday"
        )
        
        # 3. 读取本地生成的最新决策卡内容（如果有）
        decision_card_file = ROOT / "reports_output" / f"decision_card_{date_str}.txt"
        card_content = ""
        if decision_card_file.exists():
            try:
                with open(decision_card_file, "r", encoding="utf-8") as f:
                    card_content = f.read()
            except Exception:
                pass
                
        # 4. 组装缓存
        state.latest_market_data = {
            "market_date": date_str,
            "snapshot_time": time_str,
            "market_score": round(analysis.market_score, 1),
            "market_state": analysis.market_state,
            "market_style": analysis.market_style or "科技趋势",
            "suggested_position": analysis.suggested_position or "30%~50%",
            "confidence": analysis.confidence or "high",
            "indices": idx_df.to_dict(orient="records") if not idx_df.empty else [],
            "decision_card_text": card_content,
            "last_updated": f"{date_str} {time_str}"
        }
        state.last_update_time = f"{date_str} {time_str}"
        logger.info(f"5分钟市场快照推演成功 | 评分: {analysis.market_score} | 状态: {analysis.market_state}")
    except Exception as e:
        logger.error(f"5分钟行情推演异常: {e}")
    finally:
        state.is_updating = False


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 启动初始化
    logger.info("正在初始化 A股量化决策系统 FastAPI 服务...")
    state.ctx = RunContext.create(mode="close")
    state.db = Database(state.ctx.db_path)
    state.tencent = TencentProvider()
    state.sina = SinaProvider()
    state.calendar = TradingCalendar(state.db)
    state.calendar.load()
    state.market_scorer = MarketScorer(state.ctx.strategy)
    state.mainline_engine = MainlineEngine(state.ctx.strategy)
    
    # 预热一次快照
    await refresh_market_snapshot()
    
    # 启动后台定时任务
    scheduler_task = asyncio.create_task(background_market_scheduler())
    yield
    # 关闭时取消任务
    scheduler_task.cancel()
    state.db.close()
    logger.info("FastAPI 服务已安全关闭。")


app = FastAPI(
    title="A股量化交易决策微服务",
    description="提供盘中 5 分钟市场推演与多用户私有持仓风控诊断",
    version="3.0.0",
    lifespan=lifespan
)

# 允许跨域请求（供 Next.js 客户端或服务端调用）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -------------------------------------------------------------
# 请求与响应模型
# -------------------------------------------------------------
class HoldingItemReq(BaseModel):
    id: Optional[int] = None
    code: str = Field(..., description="6位股票代码")
    name: Optional[str] = Field(None, description="股票名称")
    quantity: int = Field(100, description="持股数量")
    cost_price: float = Field(0.0, description="成本价")
    hold_type: str = Field("core", description="仓位类别: core/trend/attack/trial")
    notes: Optional[str] = Field(None, description="个人备注")


class PortfolioDiagnoseReq(BaseModel):
    user_id: str = "default_user"
    holdings: List[HoldingItemReq]


# -------------------------------------------------------------
# API 路由
# -------------------------------------------------------------
@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "a_stock_review_api",
        "version": "3.0.0",
        "server_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }


@app.get("/api/v1/market/latest")
def get_latest_market():
    """获取当前最新一期的 5 分钟市场评分、状态与决策卡"""
    if not state.latest_market_data:
        today_str = datetime.now().strftime("%Y-%m-%d")
        return {
            "market_date": today_str,
            "snapshot_time": datetime.now().strftime("%H:%M:%S"),
            "market_score": 50.0,
            "market_state": "弱势震荡",
            "market_style": "科技趋势",
            "suggested_position": "30%~50%",
            "confidence": "medium",
            "indices": [],
            "decision_card_text": "正在计算盘中推演快照...",
            "last_updated": "初始化中"
        }
    return state.latest_market_data


@app.post("/api/v1/market/refresh")
async def manual_refresh(bg: BackgroundTasks):
    """手动立即触发一次行情推演"""
    bg.add_task(refresh_market_snapshot)
    return {"message": "已触发即时刷新任务", "timestamp": datetime.now().strftime("%H:%M:%S")}


@app.get("/api/v1/stock/quote/{code}")
def get_single_quote(code: str):
    """查询单只股票当前实时行情"""
    code = code.strip().zfill(6)
    df = pd.DataFrame()
    if state.tencent:
        df = state.tencent.get_realtime_quotes([code])
    if df.empty and state.sina:
        df = state.sina.get_realtime_quotes([code])
    if df.empty:
        raise HTTPException(status_code=404, detail=f"无法获取股票 {code} 的行情")
    return df.iloc[0].to_dict()


@app.post("/api/v1/portfolio/diagnose")
def diagnose_portfolio(req: PortfolioDiagnoseReq):
    """
    针对用户私有持仓进行个性化诊断与决策推演：
    1. 毫秒级批量拉取持仓标的现价
    2. 计算持仓浮盈浮亏与组合集中度
    3. 结合当前大盘状态给出加减仓/止损操作建议
    """
    if not req.holdings:
        return {
            "user_id": req.user_id,
            "summary": {
                "total_market_value": 0.0,
                "total_cost": 0.0,
                "total_pnl": 0.0,
                "total_pnl_pct": 0.0,
                "overall_action": "空仓观望",
                "risk_warning": "当前暂无持仓"
            },
            "diagnosed_holdings": []
        }
    
    # 提取代码列表并批量获取最新行情
    codes = [h.code.strip().zfill(6) for h in req.holdings]
    quotes_df = pd.DataFrame()
    if state.tencent:
        quotes_df = state.tencent.get_realtime_quotes(codes)
    if quotes_df.empty and state.sina:
        quotes_df = state.sina.get_realtime_quotes(codes)
        
    price_map = {}
    name_map = {}
    chg_map = {}
    if not quotes_df.empty and 'code' in quotes_df.columns:
        for _, r in quotes_df.iterrows():
            c = str(r['code']).zfill(6)
            price_map[c] = float(r.get('close', 0.0))
            name_map[c] = str(r.get('name', ''))
            chg_map[c] = float(r.get('change_pct', 0.0))
            
    # 获取当前大盘状态
    curr_state = state.latest_market_data.get("market_state", "弱势震荡")
    
    total_cost = 0.0
    total_mv = 0.0
    diagnosed_list = []
    
    for h in req.holdings:
        c = h.code.strip().zfill(6)
        curr_price = price_map.get(c, h.cost_price)
        stock_name = h.name or name_map.get(c, c)
        day_chg = chg_map.get(c, 0.0)
        
        cost_val = h.quantity * h.cost_price
        mv = h.quantity * curr_price
        pnl = mv - cost_val
        pnl_pct = ((curr_price - h.cost_price) / h.cost_price * 100.0) if h.cost_price > 0 else 0.0
        
        total_cost += cost_val
        total_mv += mv
        
        # 决策推演逻辑
        # 动态止损线：默认浮亏 -7% 或基于成本计算
        stop_loss = round(h.cost_price * 0.92, 2)
        
        action = "继续持有"
        advice_reason = "股价运行平稳，与大盘节奏保持一致。"
        risk_level = "低"
        
        if pnl_pct <= -8.0 or (curr_price > 0 and curr_price <= stop_loss):
            action = "纪律止损"
            advice_reason = f"已击穿关键止损位（成本回撤 {pnl_pct:.1f}%），触及 -8% 预警线，建议果断减仓防守。"
            risk_level = "高"
        elif pnl_pct >= 15.0:
            action = "分批止盈"
            advice_reason = f"累计盈利达到 {pnl_pct:.1f}%，高位出现放量震荡可逢高兑现部分浮盈。"
            risk_level = "中"
        elif day_chg <= -4.0 and curr_state in ("退潮", "极端退潮"):
            action = "主动减仓"
            advice_reason = "标的日内跌幅较大，且大盘处于退潮周期，建议控制仓位防守。"
            risk_level = "中"
        elif pnl_pct >= 3.0 and day_chg >= 2.0:
            action = "顺势持有"
            advice_reason = "主升动能完好，量价配合健康，坚定持股享受趋势红利。"
            risk_level = "低"
            
        diagnosed_list.append({
            "id": h.id,
            "code": c,
            "name": stock_name,
            "quantity": h.quantity,
            "cost_price": h.cost_price,
            "current_price": curr_price,
            "market_value": round(mv, 2),
            "pnl": round(pnl, 2),
            "pnl_pct": round(pnl_pct, 2),
            "day_change_pct": round(day_chg, 2),
            "hold_type": h.hold_type,
            "stop_loss_price": stop_loss,
            "action": action,
            "advice_reason": advice_reason,
            "risk_level": risk_level,
            "notes": h.notes or ""
        })
        
    total_pnl = total_mv - total_cost
    total_pnl_pct = (total_pnl / total_cost * 100.0) if total_cost > 0 else 0.0
    
    # 组合综合诊断
    overall_action = "控制仓位，防守反击"
    if curr_state in ("极强主升", "主升"):
        overall_action = "趋势向好，主线重仓持股"
    elif curr_state in ("退潮", "极端退潮"):
        overall_action = "市场退潮，严控风险与防守"
        
    return {
        "user_id": req.user_id,
        "summary": {
            "total_market_value": round(total_mv, 2),
            "total_cost": round(total_cost, 2),
            "total_pnl": round(total_pnl, 2),
            "total_pnl_pct": round(total_pnl_pct, 2),
            "holdings_count": len(diagnosed_list),
            "market_state": curr_state,
            "overall_action": overall_action,
            "diagnose_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        },
        "diagnosed_holdings": diagnosed_list
    }


if __name__ == "__main__":
    import uvicorn
    # 本地启动端口 8100
    uvicorn.run("api.server:app", host="127.0.0.1", port=8100, reload=False)
