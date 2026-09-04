"""股票工具函数"""
from __future__ import annotations

import re


def normalize_code(code: str) -> str:
    """标准化股票代码为纯6位数字

    Examples:
        "sh600519" -> "600519"
        "600519.SH" -> "600519"
        "SZ000001" -> "000001"
    """
    code = str(code).strip().upper()
    code = re.sub(r"[^0-9]", "", code)
    return code.zfill(6) if code else code


def code_to_market(code: str) -> str:
    """根据代码判断市场

    Returns:
        "sh" / "sz" / "bj" / "unknown"
    """
    code = normalize_code(code)
    if not code:
        return "unknown"
    prefix = code[0]
    if prefix == "6":
        return "sh"
    elif prefix in ("0", "3"):
        return "sz"
    elif prefix in ("4", "8"):
        return "bj"
    return "unknown"


def code_with_prefix(code: str) -> str:
    """代码加市场前缀: 600519 -> sh600519"""
    code = normalize_code(code)
    market = code_to_market(code)
    return f"{market}{code}"


def code_with_suffix(code: str) -> str:
    """代码加后缀: 600519 -> 600519.SH"""
    code = normalize_code(code)
    market = code_to_market(code)
    suffix = market.upper()
    return f"{code}.{suffix}"


def get_board(code: str) -> str:
    """获取板块类型

    Returns:
        "主板" / "创业板" / "科创板" / "北交所" / "未知"
    """
    code = normalize_code(code)
    if not code:
        return "未知"
    if code.startswith("6"):
        if code.startswith("688") or code.startswith("689"):
            return "科创板"
        return "主板"
    elif code.startswith("0"):
        return "主板"
    elif code.startswith("3"):
        return "创业板"
    elif code.startswith("4") or code.startswith("8"):
        return "北交所"
    return "未知"


def get_limit_pct(code: str, name: str = "") -> float:
    """获取涨跌停幅度

    Args:
        code: 股票代码
        name: 股票名称（用于判断 ST）

    Returns:
        涨跌停百分比，如 10.0, 20.0, 5.0
    """
    if name and ("ST" in name or "st" in name):
        return 5.0
    board = get_board(code)
    if board in ("创业板", "科创板"):
        return 20.0
    elif board == "北交所":
        return 30.0
    return 10.0


def is_valid_stock(code: str, name: str = "",
                   exclude_prefixes: list[str] | None = None,
                   exclude_keywords: list[str] | None = None) -> bool:
    """判断是否为有效股票（排除 ST、退市、北交所等）

    Args:
        code: 股票代码
        name: 股票名称
        exclude_prefixes: 排除的代码前缀
        exclude_keywords: 排除的名称关键词
    """
    code = normalize_code(code)
    if not code:
        return False

    # 默认排除前缀
    if exclude_prefixes is None:
        exclude_prefixes = ["688", "689", "8", "4"]
    for prefix in exclude_prefixes:
        if code.startswith(prefix):
            return False

    # 默认排除关键词
    if exclude_keywords is None:
        exclude_keywords = ["ST", "*ST", "退市", "退"]
    if name:
        for kw in exclude_keywords:
            if kw in name:
                return False

    return True


def format_amount(amount: float) -> str:
    """格式化成交额（亿）

    Examples:
        1234567890 -> "12.35亿"
        12345678900 -> "123.46亿"
    """
    if amount >= 1e12:
        return f"{amount / 1e12:.2f}万亿"
    elif amount >= 1e8:
        return f"{amount / 1e8:.2f}亿"
    elif amount >= 1e4:
        return f"{amount / 1e4:.2f}万"
    return f"{amount:.2f}"


def format_pct(pct: float) -> str:
    """格式化百分比

    Examples:
        0.0523 -> "+5.23%"
        -0.0312 -> "-3.12%"
    """
    sign = "+" if pct > 0 else ""
    return f"{sign}{pct * 100:.2f}%"
