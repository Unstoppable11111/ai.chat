import pandas as pd
import numpy as np
from loguru import logger
from typing import Dict, Any

class MarketTrendAnalyzer:
    """指数趋势分析器"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config.get('market_trend', {})
        self.ma_periods = self.config.get('ma_periods', [5, 10, 20, 60])
        self.rsi_period = self.config.get('rsi_period', 14)
        
    def analyze(self, df: pd.DataFrame) -> float:
        """
        分析市场趋势评分 (0~100)
        :param df: 包含 close, open, high, low, volume 的指数 DataFrame
        :return: 趋势评分，0-100的浮点数
        """
        try:
            if df is None or df.empty or len(df) < max(self.ma_periods):
                logger.warning("数据不足或为空，返回中性趋势评分50")
                return 50.0
                
            close = df['close'].values
            current_close = close[-1]
            
            score = 50.0
            
            # 均线分析
            for period in self.ma_periods:
                ma = df['close'].rolling(window=period).mean().iloc[-1]
                if current_close > ma:
                    score += 5.0
                else:
                    score -= 5.0
                    
            # 短期涨幅分析
            for period, weight in zip([5, 20, 60], [2, 5, 8]):
                if len(close) > period:
                    pct_change = (current_close - close[-period - 1]) / close[-period - 1]
                    score += pct_change * 100 * weight  # 涨幅转换为加分
                    
            return float(np.clip(score, 0.0, 100.0))
            
        except Exception as e:
            logger.error(f"趋势分析异常: {e}")
            return 50.0
