"use client";

interface SparklineChartProps {
  changePct?: number;
  className?: string;
  points?: number[];
}

export function SparklineChart({ changePct = 0, className = "", points }: SparklineChartProps) {
  // 生成模拟或真实分时走势坐标（根据今日涨跌幅生成平滑波浪折线）
  const isUp = changePct >= 0;
  const strokeColor = isUp ? "#f43f5e" : "#10b981"; // 红涨绿跌
  const fillColor = isUp ? "rgba(244, 63, 94, 0.15)" : "rgba(16, 185, 129, 0.15)";

  const sampleData = points && points.length >= 5
    ? points
    : isUp
    ? [20, 22, 19, 25, 24, 28, 26, 32, 30, 36, 38]
    : [38, 35, 36, 31, 33, 27, 29, 23, 25, 21, 18];

  const min = Math.min(...sampleData);
  const max = Math.max(...sampleData);
  const range = max - min || 1;
  const width = 120;
  const height = 36;

  const coords = sampleData.map((val, idx) => {
    const x = (idx / (sampleData.length - 1)) * width;
    const y = height - ((val - min) / range) * (height - 8) - 4;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const pathD = `M ${coords.join(" L ")}`;
  const areaD = `${pathD} L ${width},${height} L 0,${height} Z`;

  return (
    <div className={`w-full h-9 flex items-center overflow-hidden ${className}`}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full preserve-3d"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={`grad-${changePct > 0 ? 'up' : 'down'}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.35" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill={`url(#grad-${changePct > 0 ? 'up' : 'down'})`} />
        <path
          d={pathD}
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* 最新价位点高亮 */}
        <circle
          cx={coords[coords.length - 1].split(",")[0]}
          cy={coords[coords.length - 1].split(",")[1]}
          r="2.5"
          fill={strokeColor}
          className="animate-ping opacity-75"
        />
        <circle
          cx={coords[coords.length - 1].split(",")[0]}
          cy={coords[coords.length - 1].split(",")[1]}
          r="2"
          fill={strokeColor}
        />
      </svg>
    </div>
  );
}
