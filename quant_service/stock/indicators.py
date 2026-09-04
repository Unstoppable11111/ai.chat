"""技术指标计算模块"""
from __future__ import annotations
import numpy as np
import pandas as pd

def calc_ma(df: pd.DataFrame, periods: list[int]) -> pd.DataFrame:
    """计算多个周期的简单移动平均线"""
    res = pd.DataFrame(index=df.index)
    close = df['close'] if isinstance(df, pd.DataFrame) else df
    for p in periods:
        res[f'ma{p}'] = close.rolling(window=p, min_periods=1).mean()
    return res

def calc_ema(df: pd.DataFrame, period: int) -> pd.Series:
    """计算指数移动平均线"""
    close = df['close'] if isinstance(df, pd.DataFrame) else df
    return close.ewm(span=period, adjust=False).mean()

def calc_macd(df: pd.DataFrame, fast: int=12, slow: int=26, signal: int=9) -> pd.DataFrame:
    """计算MACD指标"""
    close = df['close'] if isinstance(df, pd.DataFrame) else df
    ema_fast = close.ewm(span=fast, adjust=False).mean()
    ema_slow = close.ewm(span=slow, adjust=False).mean()
    macd_line = ema_fast - ema_slow
    signal_line = macd_line.ewm(span=signal, adjust=False).mean()
    macd_hist = (macd_line - signal_line) * 2
    return pd.DataFrame({'macd': macd_line, 'signal': signal_line, 'hist': macd_hist})

def calc_rsi(df: pd.DataFrame, period: int=14) -> pd.Series:
    """计算RSI指标"""
    close = df['close'] if isinstance(df, pd.DataFrame) else df
    delta = close.diff()
    gain = delta.clip(lower=0)
    loss = -1 * delta.clip(upper=0)
    avg_gain = gain.rolling(window=period, min_periods=1).mean()
    avg_loss = loss.rolling(window=period, min_periods=1).mean()
    rs = avg_gain / avg_loss.replace(0, np.nan)
    rsi = 100 - (100 / (1 + rs))
    return rsi.fillna(50)

def calc_atr(df: pd.DataFrame, period: int=14) -> pd.Series:
    """计算ATR指标"""
    high = df['high']
    low = df['low']
    close = df['close'].shift(1)
    tr1 = high - low
    tr2 = (high - close).abs()
    tr3 = (low - close).abs()
    tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
    return tr.rolling(window=period, min_periods=1).mean()

def calc_slope(series: pd.Series, period: int) -> float:
    """计算趋势斜率"""
    if len(series) < period:
        return 0.0
    y = series.iloc[-period:].values
    x = np.arange(period)
    if np.isnan(y).any():
        return 0.0
    slope, _ = np.polyfit(x, y, 1)
    mean_val = np.mean(y)
    return slope / mean_val if mean_val != 0 else 0.0