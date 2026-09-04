"""数据模型定义

定义系统中所有核心数据结构，使用 dataclass 实现。
所有数据都必须带来源和时间元信息。
"""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional


# ============================================================
# 数据元信息
# ============================================================

@dataclass
class DataMeta:
    """数据可信度元信息 — 每条数据都必须附带"""
    source: str = "unknown"          # 数据源名称
    fetch_time: Optional[datetime] = None  # 获取时间
    data_time: Optional[datetime] = None   # 数据时间
    quality: str = "unknown"         # high / medium / low / stale
    is_cached: bool = False          # 是否来自缓存
    is_estimated: bool = False       # 是否为估算值


# ============================================================
# 指数数据
# ============================================================

@dataclass
class IndexQuote:
    """指数行情"""
    code: str
    name: str = ""
    close: float = 0.0
    open: float = 0.0
    high: float = 0.0
    low: float = 0.0
    volume: float = 0.0
    amount: float = 0.0
    change_pct: float = 0.0
    pre_close: float = 0.0
    ma5: float = 0.0
    ma10: float = 0.0
    ma20: float = 0.0
    ma60: float = 0.0
    meta: DataMeta = field(default_factory=DataMeta)


# ============================================================
# 股票数据
# ============================================================

@dataclass
class StockQuote:
    """股票实时行情"""
    code: str
    name: str = ""
    close: float = 0.0
    open: float = 0.0
    high: float = 0.0
    low: float = 0.0
    pre_close: float = 0.0
    volume: float = 0.0
    amount: float = 0.0
    turnover: float = 0.0          # 换手率
    change_pct: float = 0.0
    total_mv: float = 0.0         # 总市值
    circ_mv: float = 0.0          # 流通市值
    pe: float = 0.0
    pb: float = 0.0
    is_suspended: bool = False     # 是否停牌
    is_limit_up: bool = False      # 是否涨停
    is_limit_down: bool = False    # 是否跌停
    meta: DataMeta = field(default_factory=DataMeta)


@dataclass
class StockInfo:
    """股票基本信息"""
    code: str
    name: str = ""
    market: str = ""               # sh/sz
    board: str = ""                # 主板/创业板/科创板/北交所
    industry: str = ""             # 行业
    list_date: str = ""            # 上市日期
    total_shares: float = 0.0     # 总股本
    circ_shares: float = 0.0      # 流通股本
    is_st: bool = False
    meta: DataMeta = field(default_factory=DataMeta)


# ============================================================
# 板块数据
# ============================================================

@dataclass
class SectorData:
    """板块数据"""
    code: str
    name: str = ""
    sector_type: str = ""          # industry / concept
    change_pct: float = 0.0
    amount: float = 0.0
    up_count: int = 0
    down_count: int = 0
    limit_up_count: int = 0
    limit_down_count: int = 0
    leader_code: str = ""          # 龙头代码
    leader_name: str = ""          # 龙头名称
    meta: DataMeta = field(default_factory=DataMeta)


# ============================================================
# 市场分析结果
# ============================================================

@dataclass
class MarketAnalysis:
    """市场综合分析结果"""
    market_date: str = ""
    snapshot_time: str = ""
    mode: str = ""                 # morning/afternoon/close

    # 综合
    market_score: float = 0.0
    market_state: str = ""         # 极强主升/主升/强势震荡/弱势震荡/退潮/极端退潮
    market_style: str = ""
    confidence: str = ""           # high/medium/low
    suggested_position: str = ""   # "65%~80%"

    # 各维度评分（0~100）
    trend_score: float = 0.0
    breadth_score: float = 0.0
    liquidity_score: float = 0.0
    sentiment_score: float = 0.0
    mainline_score: float = 0.0
    consistency_score: float = 0.0
    high_level_risk_score: float = 0.0

    # 市场数据
    total_amount: float = 0.0      # 全A成交额（亿）
    up_count: int = 0
    down_count: int = 0
    flat_count: int = 0
    limit_up_count: int = 0
    limit_down_count: int = 0
    broken_count: int = 0          # 炸板数
    max_streak: int = 0            # 最高连板

    # 信号冲突
    conflicts: list[str] = field(default_factory=list)

    # 元信息
    data_quality: str = "unknown"
    model_version: str = "3.0.0"


# ============================================================
# 主线数据
# ============================================================

@dataclass
class MainlineInfo:
    """主线信息"""
    rank: int = 0                  # 排名
    sector_name: str = ""
    sector_code: str = ""
    strength_score: float = 0.0
    diffusion_score: float = 0.0
    persistence_days: int = 0
    change_pct_1d: float = 0.0
    change_pct_5d: float = 0.0
    change_pct_20d: float = 0.0
    amount: float = 0.0
    limit_up_count: int = 0
    leader: str = ""               # 龙头
    mid_core: str = ""             # 中军
    up_ratio: float = 0.0         # 上涨比例


# ============================================================
# 个股分析结果
# ============================================================

@dataclass
class StockAnalysis:
    """个股综合分析结果"""
    code: str
    name: str = ""

    # 综合评分
    total_score: float = 0.0
    entry_score: float = 0.0

    # 各维度评分
    industry_trend_score: float = 0.0
    sector_strength_score: float = 0.0
    stock_trend_score: float = 0.0
    volume_price_score: float = 0.0
    relative_strength_score: float = 0.0
    market_match_score: float = 0.0
    position_odds_score: float = 0.0
    crowding_score: float = 0.0
    catalyst_score: float = 0.0

    # 趋势状态
    trend_stage: str = ""          # 底部震荡/筑底/趋势启动/主升/加速/高位震荡/趋势破坏/下降趋势

    # 相对强度
    rs_1d: float = 0.0
    rs_5d: float = 0.0
    rs_20d: float = 0.0
    rs_60d: float = 0.0

    # 拥挤度
    crowding_level: str = ""       # 低拥挤/正常/偏拥挤/高度拥挤

    # 所属信息
    sector: str = ""
    mainline: str = ""

    # 交易条件
    current_price: float = 0.0
    support_price: float = 0.0
    resistance_price: float = 0.0
    stop_loss_price: float = 0.0


# ============================================================
# 持仓数据
# ============================================================

@dataclass
class HoldingItem:
    """持仓条目"""
    code: str
    name: str = ""
    quantity: int = 0
    cost_price: float = 0.0
    current_price: float = 0.0
    market_value: float = 0.0
    weight: float = 0.0            # 仓位占比
    pnl: float = 0.0              # 浮盈亏
    pnl_pct: float = 0.0          # 浮盈亏%
    hold_type: str = ""            # core/trend/attack/trial/watch
    hold_score: float = 0.0
    action: str = ""               # hold/add/reduce/clear/watch
    mainline: str = ""
    note: str = ""


# ============================================================
# 候选股
# ============================================================

@dataclass
class CandidateStock:
    """候选股"""
    code: str
    name: str = ""
    category: str = ""             # mainline_core/trend/high_odds/breakout/oversold
    total_score: float = 0.0
    entry_score: float = 0.0
    mainline_score: float = 0.0
    crowding_score: float = 0.0
    recommended_level: str = ""    # strong_buy/buy/watch/avoid
    current_price: float = 0.0
    support_price: float = 0.0
    resistance_price: float = 0.0
    stop_loss_price: float = 0.0
    suggested_weight: float = 0.0
    risk_level: str = ""           # high/medium/low
    reason: str = ""


# ============================================================
# 交易剧本
# ============================================================

@dataclass
class TradingScenario:
    """交易剧本"""
    base_case: str = ""            # 基准情景
    bull_case: str = ""            # 进攻情景
    bear_case: str = ""            # 防守情景
    risk_case: str = ""            # 风险情景


# ============================================================
# 数据质量报告
# ============================================================

@dataclass
class DataQualityReport:
    """数据质量报告"""
    check_time: str = ""
    sources_status: dict = field(default_factory=dict)   # {source: "ok"/"warning"/"error"}
    stock_count: int = 0
    missing_count: int = 0
    anomaly_count: int = 0
    overall_quality: str = "unknown"  # high/medium/low
    details: list[str] = field(default_factory=list)
