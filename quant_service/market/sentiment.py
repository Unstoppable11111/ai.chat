import pandas as pd
import numpy as np
from loguru import logger
from typing import Dict, Any

class SentimentAnalyzer:
    """情绪分析器"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config.get('sentiment', {})
        self.limit_up_strong = self.config.get('limit_up_strong', 80)
        self.limit_up_weak = self.config.get('limit_up_weak', 20)
        self.broken_rate_high = self.config.get('broken_rate_high', 0.40)
        self.broken_rate_low = self.config.get('broken_rate_low', 0.15)
        
    def analyze(self, df: pd.DataFrame) -> float:
        """
        分析情绪评分 (0~100)
        :param df: 包含 limit_up_count, limit_down_count, broken_count, max_streak, first_limit_up_count 等
        :return: 情绪评分
        """
        try:
            if df is None or df.empty:
                logger.warning("情绪分析数据为空，返回中性评分50")
                return 50.0
                
            latest = df.iloc[-1]
            limit_up = latest.get('limit_up_count', 0)
            limit_down = latest.get('limit_down_count', 0)
            broken = latest.get('broken_count', 0)
            
            score = 50.0
            
            # 涨跌停评估
            if limit_up >= self.limit_up_strong:
                score += 20.0
            elif limit_up <= self.limit_up_weak:
                score -= 10.0
                
            if limit_down > 20:
                score -= 20.0
                
            # 炸板率评估
            total_boards = limit_up + broken
            if total_boards > 0:
                broken_rate = broken / total_boards
                if broken_rate >= self.broken_rate_high:
                    score -= 15.0
                elif broken_rate <= self.broken_rate_low:
                    score += 15.0
                    
            return float(np.clip(score, 0.0, 100.0))
            
        except Exception as e:
            logger.error(f"情绪分析异常: {e}")
            return 50.0
