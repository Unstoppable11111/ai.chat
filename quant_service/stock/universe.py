"""股票池管理模块"""
from __future__ import annotations
import pandas as pd
from loguru import logger
from typing import Optional
from datetime import datetime

class UniverseManager:
    """股票池管理器"""
    def __init__(self, ctx):
        self.ctx = ctx
        self.config = ctx.get_universe()

    def filter_universe(self, df: pd.DataFrame) -> pd.DataFrame:
        """过滤股票池: ST、退市、北交所、科创板、停牌、新股(上市<60天)"""
        if df is None or df.empty:
            return df
        try:
            logger.info("开始过滤股票池...")
            mask = pd.Series(True, index=df.index)
            if 'name' in df.columns:
                mask &= ~df['name'].str.contains('ST|退', na=False)
            if 'code' in df.columns:
                mask &= ~df['code'].astype(str).str.startswith(('8', '4', '688', '689'))
            if 'is_suspended' in df.columns:
                mask &= ~df['is_suspended'].astype(bool)
            if 'list_date' in df.columns:
                now = pd.Timestamp(datetime.now())
                try:
                    list_dates = pd.to_datetime(df['list_date'], errors='coerce')
                    mask &= (now - list_dates).dt.days >= 60
                except Exception as e:
                    logger.warning(f"过滤新股异常: {e}")
            filtered = df[mask].copy()
            logger.info(f"股票池过滤完成: {len(df)} -> {len(filtered)}")
            return filtered
        except Exception as e:
            logger.error(f"股票池过滤失败: {e}")
            return df