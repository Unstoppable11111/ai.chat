"""个股数据标准化"""
from __future__ import annotations

import pandas as pd
from loguru import logger

def normalize_stock_quotes(df: pd.DataFrame, source: str) -> pd.DataFrame:
    """标准化个股行情数据"""
    if df is None or df.empty:
        return pd.DataFrame()
        
    try:
        df = df.copy()
        
        # 根据 source 提供具体的字段重命名
        rename_map = {}
        if source == "eastmoney":
            rename_map = {
                "f12": "code",
                "f14": "name",
                "f2": "close",
                "f17": "open",
                "f15": "high",
                "f16": "low",
                "f18": "pre_close",
                "f5": "volume",
                "f6": "amount",
                "f3": "change_pct",
                "f8": "turnover"
            }
        
        if rename_map:
            df = df.rename(columns=rename_map)
            
        # 补充缺失字段
        standard_cols = ['code', 'name', 'close', 'open', 'high', 'low', 'pre_close', 'volume', 'amount', 'change_pct', 'turnover']
        for col in standard_cols:
            if col not in df.columns:
                df[col] = None
                
        # 清理非法字符/横线 (例如东方财富停牌返回 '-')
        for col in ['close', 'open', 'high', 'low', 'pre_close', 'volume', 'amount']:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
                
        # 补充元信息
        df['data_source'] = source
        df['fetch_time'] = pd.Timestamp.now()
        
        return df
    except Exception as e:
        logger.error(f"标准化个股数据失败 ({source}): {e}")
        return pd.DataFrame()
