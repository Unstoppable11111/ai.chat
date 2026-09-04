import pandas as pd
import numpy as np
from loguru import logger
from typing import Dict, Any

class PersistenceAnalyzer:
    """主线持续性分析器"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config.get('sector', {})
        self.min_days = self.config.get('mainline_min_days', 3)
        
    def analyze(self, df: pd.DataFrame) -> float:
        """
        分析持续性评分 (0~100)
        :param df: 板块历史数据 DataFrame
        :return: 持续性评分
        """
        try:
            if df is None or len(df) < self.min_days:
                return 50.0
                
            # 计算过去N天的平均强度
            recent_gains = df['change_pct'].tail(self.min_days)
            positive_days = (recent_gains > 0).sum()
            
            score = 50.0
            if positive_days == self.min_days:
                score += 30.0
            elif positive_days == 0:
                score -= 30.0
                
            return float(np.clip(score, 0.0, 100.0))
            
        except Exception as e:
            logger.error(f"持续性分析异常: {e}")
            return 50.0
