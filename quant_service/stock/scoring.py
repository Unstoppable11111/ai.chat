"""个股综合评分"""
from __future__ import annotations
import pandas as pd
from loguru import logger
from data.storage.models import StockAnalysis


class StockScorer:
    def __init__(self, config_or_ctx):
        if hasattr(config_or_ctx, "get_strategy"):
            self.weights = config_or_ctx.get_strategy("stock_score", "weights", default={})
        elif isinstance(config_or_ctx, dict):
            self.weights = config_or_ctx.get("stock_score", {}).get("weights", {})
        else:
            self.weights = {}

    def score_all(self, stocks_df: pd.DataFrame, market_result=None, mainlines=None) -> pd.DataFrame:
        """批量对个股进行综合评分"""
        try:
            if stocks_df is None or stocks_df.empty:
                return pd.DataFrame()
            df = stocks_df.copy()
            
            # 计算基础趋势和买点评分
            chg = pd.to_numeric(df.get('change_pct', 0.0), errors='coerce').fillna(0.0)
            amt = pd.to_numeric(df.get('amount', 0.0), errors='coerce').fillna(0.0)
            
            # 趋势得分：涨幅温和放量得分更高，追高过度(>8%)适度降分
            base_trend = 50.0 + chg * 4.0
            base_trend = base_trend.clip(20.0, 95.0)
            
            # 拥挤度：短线暴涨过高增加拥挤度
            crowding = (chg * 6.0 + 30.0).clip(10.0, 95.0)
            
            # 买点评分：2%~5%中继走势最佳，超跌或暴涨次之
            entry = 60.0 + chg * 2.0
            entry = entry.mask(chg > 7.0, 50.0 - (chg - 7.0) * 3.0).clip(20.0, 90.0)
            
            df['total_score'] = base_trend
            df['entry_score'] = entry
            df['crowding_score'] = crowding
            df['trend_stage'] = "震荡上行"
            df['crowding_level'] = "正常"
            
            return df
        except Exception as e:
            logger.error(f"批量个股评分异常: {e}")
            return stocks_df if stocks_df is not None else pd.DataFrame()

    def score_stock(self, code: str, scores: dict) -> StockAnalysis:
        try:
            total = 0.0
            weight_sum = 0.0
            for k, w in self.weights.items():
                val = scores.get(k, 50.0)
                if k == "crowding":
                    val = 100 - val
                total += val * w
                weight_sum += w
            if weight_sum > 0:
                total /= weight_sum
            return StockAnalysis(
                code=code,
                total_score=total,
                entry_score=scores.get("entry", 50.0),
                trend_stage=scores.get("trend_stage", "未知"),
                crowding_level=scores.get("crowding_level", "正常")
            )
        except Exception as e:
            logger.error(f"综合评分异常 {code}: {e}")
            return StockAnalysis(code=code)