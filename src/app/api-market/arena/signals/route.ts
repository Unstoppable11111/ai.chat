import { NextResponse } from "next/server";
import { getRealStockQuotes } from "@/lib/quotes-service";
import { generateStrategyRecommendations } from "@/lib/quant-arena/strategies";

export async function GET() {
  try {
    const trackCodes = [
      "300502", // 新易盛
      "300476", // 胜宏科技
      "300308", // 中际旭创
      "600584", // 长电科技
      "002475", // 立讯精密
      "000977", // 浪潮信息
      "000998", // 隆平高科
      "600900", // 长江电力
      "601985", // 中国核电
      "600036", // 招商银行
    ];

    const quotes = await getRealStockQuotes(trackCodes);

    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const bjDate = new Date(utc + 3600000 * 8);
    const dateStr = bjDate.toISOString().slice(0, 10);
    const timeStr = bjDate.toTimeString().slice(0, 8);

    const signals = generateStrategyRecommendations(quotes, dateStr, timeStr);

    return NextResponse.json({
      success: true,
      data_as_of: `${dateStr} 15:00:00`,
      signals,
      total_candidates: Object.values(signals).reduce((sum, list) => sum + list.length, 0),
      rules_checked: "T+1、无未来函数、不买ST、不买科创板、透明100分量化拆解",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "生成量化策略金股信号异常",
      },
      { status: 500 }
    );
  }
}
