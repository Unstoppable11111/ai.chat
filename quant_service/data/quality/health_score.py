"""数据源健康评分模块"""
from __future__ import annotations

from typing import Dict, Any
from loguru import logger
import yaml
from pathlib import Path


class HealthScorer:
    """数据源健康评分器"""
    
    def __init__(self, config_path: str = "config/scoring.yaml"):
        self.weights = {
            "connectivity": 0.3,
            "response_time": 0.2,
            "success_rate": 0.2,
            "data_volume": 0.1,
            "completeness": 0.1,
            "value_reasonableness": 0.1
        }
        self._load_config(config_path)

    def _load_config(self, config_path: str):
        path = Path(config_path)
        if path.exists():
            try:
                with open(path, "r", encoding="utf-8") as f:
                    conf = yaml.safe_load(f)
                    if conf and "weights" in conf:
                        self.weights.update(conf["weights"])
            except Exception as e:
                logger.warning(f"加载评分配置失败，使用默认权重: {e}")

    def calculate_score(self, provider_name: str, metrics: Dict[str, Any]) -> float:
        """
        根据各项指标计算综合评分 (0-100)
        
        metrics 预期包含:
        - connected: bool
        - resp_time_ms: float
        - success_rate: float (0-1)
        - volume_score: float (0-1)
        - completeness: float (0-1)
        - value_score: float (0-1)
        """
        try:
            score = 0.0
            
            # 连接性
            conn_score = 100 if metrics.get("connected", False) else 0
            score += conn_score * self.weights["connectivity"]
            
            # 响应时间 (假设基准 500ms, 越快分数越高)
            resp_time = metrics.get("resp_time_ms", 1000)
            rt_score = max(0, 100 - (resp_time / 10))
            score += rt_score * self.weights["response_time"]
            
            # 成功率
            sr_score = metrics.get("success_rate", 0.0) * 100
            score += sr_score * self.weights["success_rate"]
            
            # 数据量
            vol_score = metrics.get("volume_score", 0.0) * 100
            score += vol_score * self.weights["data_volume"]
            
            # 完整性
            comp_score = metrics.get("completeness", 0.0) * 100
            score += comp_score * self.weights["completeness"]
            
            # 合理性
            val_score = metrics.get("value_score", 0.0) * 100
            score += val_score * self.weights["value_reasonableness"]
            
            return round(score, 2)
        except Exception as e:
            logger.error(f"计算评分失败 {provider_name}: {e}")
            return 0.0
