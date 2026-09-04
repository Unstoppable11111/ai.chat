import pandas as pd
import numpy as np
from loguru import logger
from typing import Dict, Any

class MarketBreadthAnalyzer:
    """市场宽度分析器"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config.get('market_breadth', {})
        self.strong_ratio = self.config.get('strong_ratio', 2.0)
        self.weak_ratio = self.config.get('weak_ratio', 0.5)
        
    def analyze(self, df: pd.DataFrame) -> float:
        """
        分析市场宽度评分 (0~100)
        :param df: 包含市场整体数据的 DataFrame，如 up_count, down_count, flat_count, limit_up_count, limit_down_count, new_high_count, new_low_count
        :return: 宽度评分
        """
        try:
            if df is None or df.empty:
                logger.warning("宽度分析数据为空，返回中性评分50")
                return 50.0
                
            latest = df.iloc[-1]
            up_count = latest.get('up_count', 0)
            down_count = latest.get('down_count', 0)
            
            if down_count == 0:
                down_count = 1  # 避免除以0
                
            ratio = up_count / down_count
            score = 50.0
            
            if ratio >= self.strong_ratio:
                score += 30.0
            elif ratio <= self.weak_ratio:
                score -= 30.0
            else:
                # 线性映射
                score += (ratio - 1.0) * 15.0
                
            return float(np.clip(score, 0.0, 100.0))
            
        except Exception as e:
            logger.error(f"宽度分析异常: {e}")
            return 50.0
