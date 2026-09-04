import pandas as pd
import numpy as np
from loguru import logger
from typing import Dict, Any

class DiffusionAnalyzer:
    """板块扩散度分析器"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config.get('sector', {})
        self.diffusion_strong = self.config.get('diffusion_strong', 0.60)
        self.diffusion_weak = self.config.get('diffusion_weak', 0.30)
        
    def analyze(self, df: pd.DataFrame) -> float:
        """
        分析扩散度评分 (0~100)
        :param df: 板块内部成分股数据 DataFrame
        :return: 扩散度评分
        """
        try:
            if df is None or df.empty:
                return 50.0
                
            up_ratio = df.get('up_ratio', pd.Series([0.5])).iloc[-1]
            
            score = 50.0
            if up_ratio >= self.diffusion_strong:
                score += 30.0
            elif up_ratio <= self.diffusion_weak:
                score -= 20.0
                
            return float(np.clip(score, 0.0, 100.0))
            
        except Exception as e:
            logger.error(f"扩散度分析异常: {e}")
            return 50.0
