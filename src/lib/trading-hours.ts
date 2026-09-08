/**
 * 中国 A 股交易时段核验工具
 * 规则：
 * 1. 交易日：周一至周五（排除周六、周日）
 * 2. 盘中交易时段：
 *    - 早盘：09:15 - 11:30（包含 09:15-09:25 集合竞价及 09:30 连续竞价）
 *    - 午盘：13:00 - 15:00（连续竞价及收盘集合竞价）
 * 3. 严格规则：非开盘时间自动停止 5 分钟定期轮询，且禁止手动触发刷新。
 */

export interface AShareTradingStatus {
  isTrading: boolean;
  phase:
    | "WEEKEND"
    | "PRE_OPEN"
    | "MORNING_TRADING"
    | "LUNCH_BREAK"
    | "AFTERNOON_TRADING"
    | "CLOSED";
  statusText: string;
  detail: string;
  cstTimeStr: string;
  nextSessionHint: string;
}

export function checkAShareTradingTime(targetDate: Date = new Date()): AShareTradingStatus {
  // 统一转为中国标准时间 (Asia/Shanghai, UTC+8)
  const cstStr = targetDate.toLocaleString("en-US", { timeZone: "Asia/Shanghai" });
  const cst = new Date(cstStr);

  const dayOfWeek = cst.getDay(); // 0 是周日, 6 是周六
  const hour = cst.getHours();
  const minute = cst.getMinutes();
  const second = cst.getSeconds();
  const currentMinutes = hour * 60 + minute;

  const pad = (n: number) => (n < 10 ? `0${n}` : String(n));
  const timeDisplay = `${pad(hour)}:${pad(minute)}:${pad(second)}`;

  // 1. 周末判断
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return {
      isTrading: false,
      phase: "WEEKEND",
      statusText: "周末休市",
      detail: "周末非交易日已自动停止轮询，全市场行情锁定最新收盘价",
      cstTimeStr: timeDisplay,
      nextSessionHint: "下周一 09:15 集合竞价开盘",
    };
  }

  // 2. 交易日盘前：00:00 - 09:14
  if (currentMinutes < 555) {
    return {
      isTrading: false,
      phase: "PRE_OPEN",
      statusText: "盘前未开盘",
      detail: "未到开盘时间已自动暂停刷新，避免产生无效网络请求",
      cstTimeStr: timeDisplay,
      nextSessionHint: "今日 09:15 集合竞价开盘",
    };
  }

  // 3. 早盘交易时段：09:15 - 11:30 (555 ~ 690)
  if (currentMinutes >= 555 && currentMinutes <= 690) {
    return {
      isTrading: true,
      phase: "MORNING_TRADING",
      statusText: "早盘交易中",
      detail: "09:15 - 11:30 实时交易中，5分钟自动轮询与即时刷新已激活",
      cstTimeStr: timeDisplay,
      nextSessionHint: "11:30 前持续活跃刷新",
    };
  }

  // 4. 午间休市：11:31 - 12:59 (691 ~ 779)
  if (currentMinutes > 690 && currentMinutes < 780) {
    return {
      isTrading: false,
      phase: "LUNCH_BREAK",
      statusText: "午间休市",
      detail: "11:30 - 13:00 午间休市已自动停止轮询，午后 13:00 自动恢复",
      cstTimeStr: timeDisplay,
      nextSessionHint: "下午 13:00 午盘开盘",
    };
  }

  // 5. 午后交易时段：13:00 - 15:00 (780 ~ 900)
  if (currentMinutes >= 780 && currentMinutes <= 900) {
    return {
      isTrading: true,
      phase: "AFTERNOON_TRADING",
      statusText: "午后交易中",
      detail: "13:00 - 15:00 实时交易中，5分钟自动轮询与即时刷新已激活",
      cstTimeStr: timeDisplay,
      nextSessionHint: "15:00 闭市前持续活跃刷新",
    };
  }

  // 6. 今日已收盘：15:01 - 23:59 (> 900)
  return {
    isTrading: false,
    phase: "CLOSED",
    statusText: "今日已收盘",
    detail: "15:00 闭市后已自动停止轮询并锁定收盘数据，禁止无效刷新",
    cstTimeStr: timeDisplay,
    nextSessionHint: "明日 09:15 集合竞价开盘",
  };
}
