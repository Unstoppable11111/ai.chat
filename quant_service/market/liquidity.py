import pandas as pd
import numpy as np
from loguru import logger
from typing import Dict, Any

class LiquidityAnalyzer:
    """量能/流动性分析器"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config.get('liquidity', {})
        self.ma_periods = self.config.get('ma_periods', [5, 10, 20])
        self.surge_threshold = self.config.get('volume_surge_threshold', 1.3)
        self.shrink_threshold = self.config.get('volume_shrink_threshold', 0.7)
        
    def analyze(self, df: pd.DataFrame) -> float:
        """
        分析市场量能/流动性评分 (0~100)
        :param df: 包含成交额 amount, close 等数据的 DataFrame
        :return: 流动性评分
        """
        try:
            if df is None or df.empty or len(df) < max(self.ma_periods):
                logger.warning("流动性分析数据不足，返回中性评分50")
                return 50.0
                
            current_amount = df['amount'].iloc[-1]
            prev_amount = df['amount'].iloc[-2]
            ma_20_amount = df['amount'].rolling(window=20).mean().iloc[-1]
            
            score = 50.0
            
            if ma_20_amount > 0:
                amount_ratio = current_amount / ma_20_amount
                if amount_ratio >= self.surge_threshold:
                    score += 20.0
                elif amount_ratio <= self.shrink_threshold:
                    score -= 20.0
                    
            if prev_amount > 0:
                if current_amount > prev_amount:
                    score += 10.0
                else:
                    score -= 10.0
                    
            return float(np.clip(score, 0.0, 100.0))
            
        except Exception as e:
            logger.error(f"流动性分析异常: {e}")
            return 50.0
