import { NextResponse } from "next/server";
import { getRealStockQuotes } from "@/lib/quotes-service";
import { generateStrategyRecommendations } from "@/lib/quant-arena/strategies";

export async function GET() {
  try {
    const trackCodes = [
      "600865", // 百大集团
      "600108", // 亚盛集团
      "002403", // 爱仕达
      "000158", // 常山北明
      "002085", // 万丰奥威
      "001696", // 宗申动力
      "000099", // 中信海直
      "300476", // 胜宏科技
      "600584", // 长电科技
      "002475", // 立讯精密
      "000977", // 浪潮信息
      "000998", // 隆平高科
      "600900", // 长江电力
      "601985", // 中国核电
      "600036", // 招商银行
    ];

    const quotes = await getRealStockQuotes(trackCodes);

    // 检查是否有真实有效行情返回，避免接口挂掉时伪造假信号
    const validQuotesCount = Object.keys(quotes).filter((c) => (quotes[c]?.current_price ?? 0) > 0).length;
    if (validQuotesCount === 0) {
      return NextResponse.json(
        {
          success: false,
          data_status: "UPSTREAM_UNAVAILABLE",
          error: "实时行情数据源暂时未响应，策略选股信号暂无法核准生成",
          signals: { aggressive: [], balanced: [], conservative: [] },
        },
        { status: 503 }
      );
    }

    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const bjDate = new Date(utc + 3600000 * 8);
    const dateStr = bjDate.toISOString().slice(0, 10);
    const timeStr = bjDate.toTimeString().slice(0, 8);

    const signals = generateStrategyRecommendations(quotes, dateStr, timeStr);

    return NextResponse.json({
      success: true,
      data_as_of: `${dateStr} ${timeStr}`,
      signals,
      total_candidates: Object.values(signals).reduce((sum, list) => sum + list.length, 0),
      rules_checked: "T+1、无未来函数、不买ST/科创板、激进型中小市值且持仓≤2只支持100%满仓单挑、透明100分量化拆解",
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "行情连接异常";
    return NextResponse.json(
      {
        success: false,
        data_status: "ERROR",
        error: `行情数据接口连接异常(${msg})，已暂停信号推演`,
        signals: { aggressive: [], balanced: [], conservative: [] },
      },
      { status: 500 }
    );
  }
}

