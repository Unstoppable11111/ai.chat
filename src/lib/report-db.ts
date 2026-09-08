import fs from "fs";
import path from "path";
import { executeQuery } from "@/lib/db";

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
  snapshot_json?: any;
  structured_data?: QuantStructuredResearchDaily;
  created_at: string;
}

const LOCAL_REPORTS_FILE = path.join(process.cwd(), "src", "data", "quant-daily-reports.json");
const LOCAL_RECORDS_FILE = path.join(process.cwd(), "src", "data", "quant-research-records.json");

function ensureLocalReports(): QuantDailyReport[] {
  try {
    const dir = path.dirname(LOCAL_REPORTS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(LOCAL_REPORTS_FILE)) {
      const initial: QuantDailyReport[] = [
        {
          id: 1,
          report_type: "morning",
          report_date: "2026-09-07",
          title: "【晨间全球量化内参】美股纳指高位震荡，A50夜盘温和反弹，关注算力光通信主线",
          summary: "隔夜美股三大指数窄幅分化，富时中国A50夜盘微涨0.22%，离岸人民币汇率企稳于6.708。国内算力基础设施利好发酵，开盘重点观察半导体与CPO资金承接力度。",
          content_md: `### 一、全球隔夜资产表现映射

- **美股三大指数**：道琼斯指数收跌 -0.15%，纳斯达克指数涨 +0.35%，标普500平盘。
- **中国资产**：纳斯达克中国金龙指数涨 +0.82%，富时中国A50期指夜盘收于 14,656 点（+0.22%）。
- **汇率与大宗**：离岸人民币（USD/CNH）维持在 6.708 强势震荡区间；COMEX 黄金突破 4,450 美元/盎司；WTI 原油回落至 91 美元附近。

### 二、海外权威外媒要闻与重磅产业情报

1. **【彭博社 Bloomberg】**：美联储多位官员表态偏中性，市场对年内降息节奏预期趋于平稳，全球流动性环境维持温和宽松。
2. **【路透社 Reuters】**：全球大型科技巨头继续加码下一代 AI 数据中心资本开支，高算力集群与高速光电互联模块供应链订单饱满。
3. **【国内重磅政策】**：长三角深化新一代先进制造业行动方案出台，重点推进半导体关键材料、先进封测与工业母机协同攻关。

### 三、今日 A 股盘前情绪推演与开盘剧本

- **开盘定性**：预计三大股指小幅平开或微幅高开，情绪中性偏积极。
- **关键阻力与支撑**：
  - 上证指数第一支撑位 3,910 点，短线阻力位 3,950 点。
  - 创业板指核心观察 3,400 点整数关口的放量突破情况。

### 四、今日重点跟踪题材与潜伏主线

1. **算力硬件 / CPO 先进光通信**：外盘映射驱动明确，关注龙头分时承接。
2. **半导体封测与核心材料**：政策利好频出，防御与进攻兼具。
3. **高股息中特估**：防守反击策略下的低吸底仓优选。`,
          created_at: new Date().toISOString(),
        },
        {
          id: 2,
          report_type: "closing",
          report_date: "2026-09-07",
          title: "【收盘全景量化复盘】两市成交逼近2万亿高位放量，多头占据主动，注意结构性分化",
          summary: "今日A股迎来放量攻坚行情，两市成交额达 1.95 万亿元，超 3000 只个股飘红。创业板指大涨 +3.41% 领跑，主力资金深度聚焦硬科技主线，后市以持股防守反击为主。",
          content_md: `### 一、全天市场格局定性：放量突破，多头掌握主动权

今日A股各大股指呈现单边震荡走高态势：
- **上证指数**：收报 3,932.70 点（+0.07%），盘中探底回升，高位整固。
- **深证成指**：收报 13,774.91 点（+1.91%）。
- **创业板指**：收报 3,398.68 点（+3.41%），领涨两市。
- **科创50**：收报 1,615.53 点（+2.42%）。
- **两市量能**：全天成交额达 **1.95 万亿元**，较上一交易日显著放量，交投情绪极其活跃。

### 二、主力资金与板块博弈深度剖析

- **主导赛道**：半导体封测、PCB服务器板、光器件及消费电子全面爆发，主力资金净流入规模超 150 亿元。
- **多空分布**：全市场上涨 3,073 家，下跌 2,016 家，平盘 195 家。多头占比达 58.2%，市场赚钱效应良好。
- **涨停与炸板率**：今日全市场涨停 72 家，跌停仅 2 家，炸板率降至 16.4%，处于极佳的情绪上升周期。

### 三、明日操作指南与风控底线

1. **仓位指引**：量化模型评分为 **52.5分**，建议维持 **40%~60%** 仓位，避免盲目满仓追高。
2. **个股应对策略**：
   - 处于均线多头的主线核心龙头标的（如半导体封测龙头），建议继续依托 5 日均线持有并上移动态止盈线。
   - 对涨幅过大、脱离均线乖离率过高的个股，逢高逐步减仓兑现浮盈。`,
          created_at: new Date().toISOString(),
        },
      ];
      fs.writeFileSync(LOCAL_REPORTS_FILE, JSON.stringify(initial, null, 2), "utf8");
      return initial;
    }
    const content = fs.readFileSync(LOCAL_REPORTS_FILE, "utf8");
    return JSON.parse(content || "[]");
  } catch {
    return [];
  }
}

function saveLocalReports(reports: QuantDailyReport[]) {
  try {
    const dir = path.dirname(LOCAL_REPORTS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(LOCAL_REPORTS_FILE, JSON.stringify(reports, null, 2), "utf8");
  } catch (err) {
    console.error("保存本地研报文件异常:", err);
  }
}

export async function getLatestDailyReport(type: "morning" | "closing"): Promise<QuantDailyReport | null> {
  try {
    const rows = await executeQuery<any[]>(
      `SELECT * FROM quant_daily_reports WHERE report_type = ? ORDER BY report_date DESC, id DESC LIMIT 1`,
      [type]
    );
    if (rows && rows.length > 0) {
      return (rows[0] as unknown) as QuantDailyReport;
    }
  } catch (err) {
    // 数据库未配置或连接异常，平滑回退至本地存储
  }

  const local = ensureLocalReports();
  const matched = local.filter((r) => r.report_type === type).sort((a, b) => b.id - a.id);
  return matched[0] || null;
}

export async function saveDailyReport(data: {
  report_type: "morning" | "closing";
  report_date: string;
  title: string;
  summary: string;
  content_md: string;
  snapshot_json?: any;
  structured_data?: QuantStructuredResearchDaily;
}): Promise<QuantDailyReport> {
  const now = new Date().toISOString();
  try {
    const res: any = await executeQuery(
      `INSERT INTO quant_daily_reports (report_type, report_date, title, summary, content_md, snapshot_json) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        data.report_type,
        data.report_date,
        data.title,
        data.summary,
        data.content_md,
        JSON.stringify(data.snapshot_json || data.structured_data || {}),
      ]
    );
    const newId = res?.insertId || Date.now();
    return {
      id: newId,
      ...data,
      created_at: now,
    };
  } catch (err) {
    // 降级使用本地存储
  }

  const local = ensureLocalReports();
  const newReport: QuantDailyReport = {
    id: local.length > 0 ? Math.max(...local.map((r) => r.id)) + 1 : 1,
    ...data,
    created_at: now,
  };
  // 更新或推入
  const filtered = local.filter(
    (r) => !(r.report_type === data.report_type && r.report_date === data.report_date)
  );
  filtered.unshift(newReport);
  saveLocalReports(filtered);

  // 若存在结构化验证记录，同步持久化到投研数据库
  if (data.structured_data?.track_records && data.structured_data.track_records.length > 0) {
    appendResearchTrackRecords(data.structured_data.track_records);
  }

  return newReport;
}

export async function getDailyReportHistory(type: "morning" | "closing", limit = 10): Promise<QuantDailyReport[]> {
  try {
    const rows = await executeQuery<any[]>(
      `SELECT * FROM quant_daily_reports WHERE report_type = ? ORDER BY report_date DESC, id DESC LIMIT ?`,
      [type, limit]
    );
    if (rows && rows.length > 0) {
      return (rows as unknown) as QuantDailyReport[];
    }
  } catch {}

  const local = ensureLocalReports();
  return local.filter((r) => r.report_type === type).slice(0, limit);
}

/**
 * 获取永久持久化的科技成长投研跟踪验证库 (事实 / 当时判断 / 后续结果)
 */
export function getResearchTrackRecords(): ResearchTrackRecord[] {
  try {
    if (!fs.existsSync(LOCAL_RECORDS_FILE)) {
      // 默认提供标杆级真实样例初始数据
      const initial: ResearchTrackRecord[] = [
        {
          id: "trk-20260907-001",
          date: "2026-09-07",
          stock_code: "300502",
          stock_name: "新易盛",
          industry: "CPO光模块",
          fact: "北美三大云巨头 1.6T 光模块采购需求提前释放，公司 800G/1.6T 产线三季度排产环比增长超 35%，毛利率稳定在 38% 高景气位。",
          initial_prediction: "突破 380 元前高箱体，主升浪右侧加速，2026年盈利预期上修至 45 亿，目标空间 +25%，防守止损线设在 368 元。",
          predicted_direction: "BULL",
          time_horizon: "T+10 (2周跟踪)",
          verification_date: "2026-09-20",
          actual_outcome: "2026-09-08 盘中已突破 416 元 (+7.8%)，盈利预测上修逻辑获机构大单持续验证。",
          verification_status: "VERIFIED_CORRECT",
          actual_return_pct: 7.88,
          accuracy_score: 95,
          signal_type: "产业趋势×业绩上修×突破放量",
        },
        {
          id: "trk-20260907-002",
          date: "2026-09-07",
          stock_code: "300476",
          stock_name: "胜宏科技",
          industry: "高速PCB",
          fact: "高阶高多层 AI 算力服务器板进入核心海外算力加速卡供应链独供体系，HDI 产能利用率达 98%。",
          initial_prediction: "220 元均线多头回踩企稳，算力高弹性细分龙头，目标价 260 元 (+18%)，严格止损 210 元。",
          predicted_direction: "BULL",
          time_horizon: "T+15 (1个月)",
          verification_date: "2026-09-22",
          actual_outcome: "2026-09-08 现价 229 元 (+4.3%)，量价结构健康，持续处于右侧多头主升通道。",
          verification_status: "TRACKING",
          actual_return_pct: 4.33,
          accuracy_score: 88,
          signal_type: "海外供应链映射×高多层PCB×业绩弹性",
        },
        {
          id: "trk-20260908-003",
          date: "2026-09-08",
          stock_code: "300308",
          stock_name: "中际旭创",
          industry: "CPO光通信中军",
          fact: "全球 AI 数据中心网络升级至 800G/1.6T 时代，公司硅光光引擎良率突破 90%，出货量蝉联全球前二。",
          initial_prediction: "大成交额中军标的，2026 年 PE 处于 24 倍合理估值分位，稳健看多，预计向上修复估值 15%~20%。",
          predicted_direction: "BULL",
          time_horizon: "1个月",
          verification_date: "2026-10-08",
          actual_outcome: "跟踪观察中，待 9 月下旬供应链交付数据出炉进一步验证。",
          verification_status: "TRACKING",
          actual_return_pct: 1.2,
          accuracy_score: 85,
          signal_type: "中军底仓×低估值成长×全球市占率领先",
        },
      ];
      const dir = path.dirname(LOCAL_RECORDS_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(LOCAL_RECORDS_FILE, JSON.stringify(initial, null, 2), "utf8");
      return initial;
    }
    const content = fs.readFileSync(LOCAL_RECORDS_FILE, "utf8");
    return JSON.parse(content || "[]");
  } catch (err) {
    console.error("读取投研验证记录异常:", err);
    return [];
  }
}

/**
 * 增量持久化投研验证记录 (事实 / 当时判断 / 后续结果)
 */
export function appendResearchTrackRecords(newRecords: ResearchTrackRecord[]) {
  try {
    const existing = getResearchTrackRecords();
    const map = new Map<string, ResearchTrackRecord>();
    existing.forEach((r) => map.set(r.id, r));
    newRecords.forEach((r) => map.set(r.id, r));
    const merged = Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));

    const dir = path.dirname(LOCAL_RECORDS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(LOCAL_RECORDS_FILE, JSON.stringify(merged, null, 2), "utf8");
  } catch (err) {
    console.error("保存投研验证记录异常:", err);
  }
}

