"""日志配置模块

使用 loguru 提供统一的日志接口，支持文件轮转和控制台彩色输出。
"""
import sys
from pathlib import Path

from loguru import logger


def setup_logger(log_dir: str = "logs", level: str = "INFO",
                 rotation: str = "10 MB", retention: str = "30 days") -> None:
    """初始化日志系统

    Args:
        log_dir: 日志目录
        level: 日志级别
        rotation: 日志文件轮转大小
        retention: 日志保留时间
    """
    log_path = Path(log_dir)
    log_path.mkdir(parents=True, exist_ok=True)

    # 移除默认处理器
    logger.remove()

    # 控制台输出（彩色）
    logger.add(
        sys.stderr,
        level=level,
        format="<green>{time:HH:mm:ss}</green> | <level>{level: <8}</level> | "
               "<cyan>{name}</cyan>:<cyan>{function}</cyan> | <level>{message}</level>",
        colorize=True,
    )

    # 文件输出（详细）
    logger.add(
        str(log_path / "system_{time:YYYY-MM-DD}.log"),
        level="DEBUG",
        format="{time:YYYY-MM-DD HH:mm:ss.SSS} | {level: <8} | "
               "{name}:{function}:{line} | {message}",
        rotation=rotation,
        retention=retention,
        encoding="utf-8",
        enqueue=True,  # 线程安全
    )

    # 错误专用日志
    logger.add(
        str(log_path / "error_{time:YYYY-MM-DD}.log"),
        level="ERROR",
        format="{time:YYYY-MM-DD HH:mm:ss.SSS} | {level: <8} | "
               "{name}:{function}:{line} | {message}\n{exception}",
        rotation=rotation,
        retention=retention,
        encoding="utf-8",
        enqueue=True,
    )

    logger.info(f"日志系统初始化完成 | 目录: {log_path.resolve()} | 级别: {level}")
