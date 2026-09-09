export interface ResearchTrackRecord {
  id: string;
  date: string;                      // 报告日期，如 2026-09-08
  stock_code: string;                // 标的代码，如 300502
  stock_name: string;                // 标的名称，如 新易盛
  industry: string;                  // CPO光模块 / 高速PCB / 先进封装
  fact: string;                      // 【客观事实】：海外云巨头加速1.6T采购，三季度排产环比增长35%
  initial_prediction: string;        // 【当时判断】：主升浪右侧突破，2026年盈利上修，目标空间+20%
  predicted_direction: "BULL" | "BEAR" | "NEUTRAL";
  time_horizon: string;              // 验证周期：T+5 / 1个月 / 季报期
  verification_date: string;         // 计划核验基准日
  actual_outcome: string;            // 【后续结果】：初始为"跟踪中"，由行情/财报自动或手动核验回填
  verification_status: "TRACKING" | "VERIFIED_CORRECT" | "VERIFIED_WRONG" | "EXPIRED";
  actual_return_pct?: number;        // 实际区间回报率
  accuracy_score?: number;           // 准确度评分 0-100
  signal_type: string;               // 信号分类：产业趋势×业绩上修×突破放量
}

export interface QuantStructuredResearchDaily {
  date: string;
  generated_at: string;
  title: string;
  executive_summary: string;         // 头部 2-3 句话浓缩结论
  market_regime: string;             // 市场环境定性（如：强趋势/结构性主升/高位分化）
  events: Array<{
    level: string;                   // ★★★★★
    title: string;
    industry: string;
    impact: string;
    market_traded: boolean;
    source: string;
  }>;
  industries: string[];
  companies: Array<{
    code: string;
    name: string;
    chain: string;
    logic: string;
    perf_2026e: string;
    pe: string;
    position: string;
    divergence: string;
    rating: "S" | "A" | "B";
  }>;
  opportunities: string[];
  risks: string[];
  watchlist: string[];
  sources: string[];
  track_records: ResearchTrackRecord[]; // 核心：事实 / 当时判断 / 后续结果永久记录
}

export interface QuantDailyReport {
  id: number;
  report_type: "morning" | "closing";
  report_date: string;
  title: string;
  summary: string;
  content_md: string;
  snapshot_json?: Record<string, unknown>;
  structured_data?: QuantStructuredResearchDaily;
  created_at: string;
}

