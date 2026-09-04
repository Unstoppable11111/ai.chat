"""数据源管理器

负责多数据源的健康检查、自动降级、交叉验证。
核心原则：任何单一数据源失败不会导致系统崩溃。
"""
from __future__ import annotations

import time
from typing import Optional, Callable, Any

import pandas as pd
from loguru import logger

from data.provider_base import QuoteProvider


class ProviderHealth:
    """数据源健康状态"""

    def __init__(self, name: str):
        self.name = name
        self.available: bool = False
        self.response_time: float = 0.0
        self.success_count: int = 0
        self.fail_count: int = 0
        self.last_check_time: float = 0.0
        self.score: float = 0.0
        self.message: str = ""

    @property
    def success_rate(self) -> float:
        total = self.success_count + self.fail_count
        return self.success_count / total if total > 0 else 0.0

    def record_success(self, response_time: float) -> None:
        self.available = True
        self.response_time = response_time
        self.success_count += 1
        self.last_check_time = time.time()
        self._update_score()

    def record_failure(self, message: str = "") -> None:
        self.fail_count += 1
        self.last_check_time = time.time()
        self.message = message
        self._update_score()
        if self.success_rate < 0.3:
            self.available = False

    def _update_score(self) -> None:
        """计算健康评分 0~100"""
        score = 0.0
        # 可用性 40分
        if self.available:
            score += 40
        # 响应时间 30分（<1s=30, <3s=20, <5s=10, >5s=0）
        if self.response_time < 1.0:
            score += 30
        elif self.response_time < 3.0:
            score += 20
        elif self.response_time < 5.0:
            score += 10
        # 成功率 30分
        score += self.success_rate * 30
        self.score = round(score, 1)


class ProviderManager:
    """数据源管理器

    管理多个数据源，自动健康检查、优先级排序、故障降级。
    """

    def __init__(self):
        self._providers: dict[str, QuoteProvider] = {}
        self._health: dict[str, ProviderHealth] = {}
        self._priority_order: list[str] = []

    def register(self, provider: QuoteProvider) -> None:
        """注册数据源"""
        name = provider.name
        self._providers[name] = provider
        self._health[name] = ProviderHealth(name)
        if name not in self._priority_order:
            self._priority_order.append(name)
        logger.debug(f"已注册数据源: {name}")

    def health_check_all(self) -> dict[str, ProviderHealth]:
        """对所有数据源执行健康检查"""
        logger.info("开始数据源健康检查...")
        results = {}
        for name, provider in self._providers.items():
            health = self._health[name]
            try:
                start = time.time()
                result = provider.health_check()
                elapsed = time.time() - start

                if result.get("available", False):
                    health.record_success(elapsed)
                    logger.info(
                        f"  {name}: ✅ 可用 | "
                        f"响应 {elapsed:.2f}s | 评分 {health.score}"
                    )
                else:
                    health.record_failure(result.get("message", "不可用"))
                    logger.warning(
                        f"  {name}: ❌ 不可用 | {health.message}"
                    )
            except Exception as e:
                health.record_failure(str(e))
                logger.warning(f"  {name}: ❌ 异常 | {e}")

            results[name] = health

        # 按健康评分重排优先级
        self._priority_order = sorted(
            self._providers.keys(),
            key=lambda n: self._health[n].score,
            reverse=True,
        )
        available = [n for n in self._priority_order if self._health[n].available]
        logger.info(
            f"健康检查完成 | 可用: {len(available)}/{len(self._providers)} | "
            f"优先级: {' > '.join(self._priority_order)}"
        )
        return results

    def get_provider(self, name: str) -> Optional[QuoteProvider]:
        """获取指定数据源"""
        return self._providers.get(name)

    def get_best_provider(self) -> Optional[QuoteProvider]:
        """获取当前最佳数据源"""
        for name in self._priority_order:
            if self._health[name].available:
                return self._providers[name]
        # 全部不可用时返回第一个（可能是缓存）
        if self._providers:
            return list(self._providers.values())[-1]
        return None

    def call_with_fallback(
        self,
        method_name: str,
        *args,
        providers: Optional[list[str]] = None,
        **kwargs,
    ) -> pd.DataFrame:
        """带降级的方法调用

        按优先级依次尝试各数据源，失败自动切换到下一个。

        Args:
            method_name: 数据源方法名，如 "get_realtime_quotes"
            *args: 方法参数
            providers: 指定数据源列表，默认按优先级
            **kwargs: 方法关键字参数

        Returns:
            成功时返回 DataFrame，全部失败返回空 DataFrame
        """
        order = providers or self._priority_order
        errors = []

        for name in order:
            provider = self._providers.get(name)
            if not provider:
                continue

            method = getattr(provider, method_name, None)
            if not method:
                continue

            health = self._health[name]
            try:
                start = time.time()
                result = method(*args, **kwargs)
                elapsed = time.time() - start
                health.record_success(elapsed)

                if isinstance(result, pd.DataFrame) and not result.empty:
                    logger.debug(
                        f"[{name}] {method_name} 成功 | "
                        f"行数: {len(result)} | {elapsed:.2f}s"
                    )
                    return result
                elif isinstance(result, list) and result:
                    # 返回列表的方法（如 get_trading_calendar）
                    return result  # type: ignore

                logger.debug(f"[{name}] {method_name} 返回空结果，尝试下一个源")

            except Exception as e:
                health.record_failure(str(e))
                errors.append(f"{name}: {e}")
                logger.warning(f"[{name}] {method_name} 失败: {e}，切换备用源")

        logger.error(
            f"{method_name} 所有数据源均失败 | 错误: {'; '.join(errors)}"
        )
        return pd.DataFrame()

    def get_health_summary(self) -> list[dict]:
        """获取健康状态摘要"""
        summary = []
        for name in self._priority_order:
            h = self._health[name]
            summary.append({
                "name": name,
                "available": h.available,
                "score": h.score,
                "response_time": round(h.response_time, 2),
                "success_rate": round(h.success_rate * 100, 1),
                "message": h.message,
            })
        return summary

    def get_health_display(self) -> str:
        """获取健康状态展示文本"""
        lines = ["数据源健康状态:"]
        for item in self.get_health_summary():
            status = "✅" if item["available"] else "❌"
            lines.append(
                f"  {status} {item['name']:15s} | "
                f"评分: {item['score']:5.1f} | "
                f"响应: {item['response_time']:.2f}s | "
                f"成功率: {item['success_rate']:.0f}%"
            )
        return "\n".join(lines)
