"""运行上下文

管理当前运行的模式、日期、配置，作为各模块间共享状态的容器。
"""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, date
from pathlib import Path
from typing import Any, Optional

import yaml
from loguru import logger


@dataclass
class RunContext:
    """运行上下文 — 贯穿整个 pipeline 的共享状态"""

    # 运行模式
    mode: str = "close"               # morning / afternoon / close
    run_date: str = ""                # YYYY-MM-DD
    run_time: str = ""                # HH:MM:SS

    # 配置
    settings: dict = field(default_factory=dict)
    strategy: dict = field(default_factory=dict)
    universe: dict = field(default_factory=dict)

    # 项目根目录
    project_root: Path = field(default_factory=lambda: Path(__file__).parent.parent)

    # 模型版本
    model_version: str = "3.0.0"

    @classmethod
    def create(cls, mode: str = "close",
               target_date: Optional[str] = None) -> "RunContext":
        """创建运行上下文

        Args:
            mode: 运行模式 morning/afternoon/close
            target_date: 指定日期，默认今天
        """
        now = datetime.now()
        ctx = cls(
            mode=mode,
            run_date=target_date or now.strftime("%Y-%m-%d"),
            run_time=now.strftime("%H:%M:%S"),
        )
        ctx._load_configs()
        return ctx

    def _load_configs(self) -> None:
        """加载 YAML 配置文件"""
        config_dir = self.project_root / "config"

        for name in ["settings", "strategy", "universe"]:
            config_file = config_dir / f"{name}.yaml"
            if config_file.exists():
                with open(config_file, "r", encoding="utf-8") as f:
                    setattr(self, name, yaml.safe_load(f) or {})
                logger.debug(f"已加载配置: {name}.yaml")
            else:
                logger.warning(f"配置文件不存在: {config_file}")

    def get_setting(self, *keys: str, default: Any = None) -> Any:
        """获取 settings 配置值（支持多级 key）

        Example:
            ctx.get_setting("data_sources", "realtime")
        """
        return self._nested_get(self.settings, keys, default)

    def get_strategy(self, *keys: str, default: Any = None) -> Any:
        """获取 strategy 配置值"""
        return self._nested_get(self.strategy, keys, default)

    def get_universe(self, *keys: str, default: Any = None) -> Any:
        """获取 universe 配置值"""
        return self._nested_get(self.universe, keys, default)

    @staticmethod
    def _nested_get(d: dict, keys: tuple, default: Any = None) -> Any:
        """嵌套字典取值"""
        for key in keys:
            if isinstance(d, dict):
                d = d.get(key, default)
            else:
                return default
        return d

    @property
    def db_path(self) -> str:
        """数据库路径"""
        rel = self.get_setting("database", "path", default="database/a_stock.db")
        return str(self.project_root / rel)

    @property
    def reports_dir(self) -> Path:
        """报告输出目录"""
        rel = self.get_setting("reports", "output_dir", default="reports_output")
        p = self.project_root / rel
        p.mkdir(parents=True, exist_ok=True)
        return p

    @property
    def logs_dir(self) -> str:
        """日志目录"""
        rel = self.get_setting("logging", "dir", default="logs")
        return str(self.project_root / rel)

    @property
    def is_morning(self) -> bool:
        return self.mode == "morning"

    @property
    def is_afternoon(self) -> bool:
        return self.mode == "afternoon"

    @property
    def is_close(self) -> bool:
        return self.mode == "close"
