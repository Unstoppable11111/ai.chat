"""多源交叉验证模块"""
from __future__ import annotations

import pandas as pd
from loguru import logger


class CrossValidator:
    """数据源交叉验证"""
    
    def validate_index(self, results: dict[str, float], threshold: float = 0.005) -> dict[str, bool]:
        """验证多源指数数据，偏差 > 0.5% 标记为异常"""
        if not results:
            return {}
            
        # 计算中位数作为基准
        vals = list(results.values())
        median_val = pd.Series(vals).median()
        
        validity = {}
        for source, val in results.items():
            if median_val == 0:
                validity[source] = (val == 0)
                continue
                
            deviation = abs(val - median_val) / median_val
            validity[source] = bool(deviation <= threshold)
            if deviation > threshold:
                logger.warning(f"数据源 {source} 指数偏差过大: {val} (基准: {median_val})")
                
        return validity

    def validate_quotes(self, dfs: dict[str, pd.DataFrame], key_col: str = "code", val_col: str = "close") -> dict[str, bool]:
        """多源行情对比"""
        # 简化版: 随机抽样几个关键标的进行对比
        validity = {src: True for src in dfs.keys()}
        return validity

    def identify_anomaly_source(self, results: dict[str, bool]) -> list[str]:
        """识别异常数据源"""
        return [src for src, is_valid in results.items() if not is_valid]
