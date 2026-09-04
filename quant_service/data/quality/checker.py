"""数据质量检测模块"""
from __future__ import annotations

from dataclasses import dataclass, field
import pandas as pd
from loguru import logger


@dataclass
class DataQualityReport:
    """数据质量报告模型"""
    check_time: str = ""
    is_valid: bool = True
    overall_quality: str = "high"
    stock_count: int = 0
    missing_count: int = 0
    anomaly_count: int = 0
    completeness: float = 1.0
    issues: list[str] = field(default_factory=list)
    details: list[str] = field(default_factory=list)


class DataQualityChecker:
    """数据质量检测器"""
    
    def check_stock_count(self, df: pd.DataFrame, min_count: int = 4000) -> tuple[bool, str]:
        if df.empty:
            return False, "数据为空"
        count = len(df)
        if count < 2000:
            return False, f"股票数量极度异常: {count}"
        if count < min_count:
            return False, f"股票数量偏少: {count}"
        return True, "OK"

    def check_price_anomaly(self, df: pd.DataFrame) -> tuple[bool, str]:
        if df.empty or 'close' not in df.columns:
            return False, "无价格数据"
        
        invalid_prices = df[(df['close'] <= 0) | (df['close'] > 10000)]
        if not invalid_prices.empty:
            return False, f"存在 {len(invalid_prices)} 条价格异常数据"
        return True, "OK"

    def check_volume_anomaly(self, df: pd.DataFrame) -> tuple[bool, str]:
        if df.empty or 'volume' not in df.columns:
            return False, "无成交量数据"
        
        invalid_vols = df[df['volume'] < 0]
        if not invalid_vols.empty:
            return False, f"存在 {len(invalid_vols)} 条负成交量数据"
        return True, "OK"

    def check_completeness(self, df: pd.DataFrame, required_cols: list[str]) -> tuple[float, str]:
        if df.empty:
            return 0.0, "数据为空"
        
        missing = [col for col in required_cols if col not in df.columns]
        if missing:
            return 0.0, f"缺失字段: {','.join(missing)}"
            
        null_ratio = df[required_cols].isnull().mean().mean()
        completeness = 1.0 - null_ratio
        
        if completeness < 0.9:
            return completeness, f"数据完整度低: {completeness:.2%}"
        return completeness, "OK"

    def run_all_checks(self, df: pd.DataFrame, expected_type: str = "realtime") -> DataQualityReport:
        issues = []
        count_valid, msg = self.check_stock_count(df)
        if not count_valid:
            issues.append(msg)
            
        price_valid, msg = self.check_price_anomaly(df)
        if not price_valid:
            issues.append(msg)
            
        volume_valid, msg = self.check_volume_anomaly(df)
        if not volume_valid:
            issues.append(msg)
            
        required = ['code', 'name', 'close', 'volume', 'amount']
        completeness, msg = self.check_completeness(df, required)
        if completeness < 0.9:
            issues.append(msg)
            
        is_valid = count_valid and price_valid and volume_valid and (completeness >= 0.9)
        total_count = len(df) if not df.empty else 0
        
        overall = "high"
        if not is_valid or total_count < 4000:
            overall = "medium"
        if total_count < 2000 or len(issues) > 2:
            overall = "low"
            
        return DataQualityReport(
            is_valid=is_valid,
            overall_quality=overall,
            stock_count=total_count,
            missing_count=0,
            anomaly_count=len(issues),
            completeness=completeness,
            issues=issues,
            details=issues
        )
