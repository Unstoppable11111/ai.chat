"""市场综合评分"""
from __future__ import annotations
import pandas as pd
from loguru import logger
from typing import Dict, Any, List
from data.storage.models import MarketAnalysis
from market.state_machine import MarketStateMachine


class MarketScorer:
    """市场综合评分器"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.weights = config.get('market_score', {}).get('weights', {})
        self.state_machine = MarketStateMachine(config)
        
    def analyze(self, index_df=None, all_stocks_df=None, sector_df=None, date: str = "", mode: str = "close") -> MarketAnalysis:
        """主入口分析方法，根据传入的数据框计算综合市场状态"""
        try:
            # 趋势评分
            trend_score = 50.0
            if index_df is not None and not index_df.empty and 'change_pct' in index_df.columns:
                avg_pct = float(index_df['change_pct'].mean())
                trend_score = float(min(max(50.0 + avg_pct * 15.0, 10.0), 90.0))

            # 宽度与情绪
            breadth_score = 50.0
            sentiment_score = 50.0
            up_count = 0
            down_count = 0
            limit_up_count = 0
            limit_down_count = 0
            total_amount = 0.0

            if all_stocks_df is not None and not all_stocks_df.empty:
                if 'amount' in all_stocks_df.columns:
                    total_amount = float(all_stocks_df['amount'].sum())
                if 'change_pct' in all_stocks_df.columns:
                    up_count = int((all_stocks_df['change_pct'] > 0).sum())
                    down_count = int((all_stocks_df['change_pct'] < 0).sum())
                    limit_up_count = int((all_stocks_df['change_pct'] >= 9.8).sum())
                    limit_down_count = int((all_stocks_df['change_pct'] <= -9.8).sum())
                    total_valid = up_count + down_count
                    if total_valid > 0:
                        up_ratio = up_count / total_valid
                        breadth_score = float(min(max(up_ratio * 100, 10.0), 90.0))
                        sentiment_score = float(min(max(breadth_score * 0.7 + limit_up_count * 0.5, 10.0), 95.0))

            # 主线评分
            mainline_score = 50.0
            if sector_df is not None and not sector_df.empty and 'change_pct' in sector_df.columns:
                top3_avg = float(sector_df.nlargest(3, 'change_pct')['change_pct'].mean())
                mainline_score = float(min(max(50.0 + top3_avg * 10.0, 20.0), 95.0))

            liquidity_score = 55.0
            consistency_score = 60.0
            high_level_risk_score = 30.0
            conflicts = []

            analysis = self.score(
                trend_score=trend_score,
                breadth_score=breadth_score,
                liquidity_score=liquidity_score,
                sentiment_score=sentiment_score,
                mainline_score=mainline_score,
                consistency_score=consistency_score,
                high_level_risk_score=high_level_risk_score,
                conflicts=conflicts,
                prev_states=[]
            )
            analysis.market_date = date
            analysis.mode = mode
            analysis.up_count = up_count
            analysis.down_count = down_count
            analysis.limit_up_count = limit_up_count
            analysis.limit_down_count = limit_down_count
            analysis.total_amount = total_amount
            return analysis
        except Exception as e:
            logger.error(f"市场分析计算异常: {e}")
            return MarketAnalysis(market_score=50.0, market_state="弱势震荡", confidence="low")

    def score(self, 
              trend_score: float, 
              breadth_score: float, 
              liquidity_score: float, 
              sentiment_score: float, 
              mainline_score: float, 
              consistency_score: float, 
              high_level_risk_score: float, 
              conflicts: List[str],
              prev_states: List[str]) -> MarketAnalysis:
        """汇总各维度评分，输出市场分析结果"""
        try:
            total_score = (
                trend_score * self.weights.get('trend', 0.20) +
                breadth_score * self.weights.get('breadth', 0.15) +
                liquidity_score * self.weights.get('liquidity', 0.15) +
                sentiment_score * self.weights.get('sentiment', 0.15) +
                mainline_score * self.weights.get('mainline', 0.15) +
                consistency_score * self.weights.get('consistency', 0.10) - 
                high_level_risk_score * self.weights.get('high_level_risk', 0.10)
            )
            
            market_score = float(max(min(total_score, 100.0), 0.0))
            state = self.state_machine.get_state(market_score, prev_states)
            
            confidence = "high"
            if len(conflicts) > 0:
                confidence = "low" if len(conflicts) > 1 else "medium"
                
            suggested_pos = "50%"
            if market_score >= 75:
                suggested_pos = "70%~90%"
            elif market_score >= 60:
                suggested_pos = "50%~70%"
            elif market_score >= 40:
                suggested_pos = "30%~50%"
            else:
                suggested_pos = "0%~20%"
            
            analysis = MarketAnalysis(
                market_score=market_score,
                market_state=state,
                confidence=confidence,
                suggested_position=suggested_pos,
                trend_score=trend_score,
                breadth_score=breadth_score,
                liquidity_score=liquidity_score,
                sentiment_score=sentiment_score,
                mainline_score=mainline_score,
                consistency_score=consistency_score,
                high_level_risk_score=high_level_risk_score,
                conflicts=conflicts
            )
            return analysis
        except Exception as e:
            logger.error(f"综合评分异常: {e}")
            return MarketAnalysis(market_score=50.0, confidence="low")
