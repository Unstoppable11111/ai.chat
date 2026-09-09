import { NextResponse } from "next/server";
import { getRealStockQuotes } from "@/lib/quotes-service";
import { generateStrategyRecommendations } from "@/lib/quant-arena/strategies";

export async function GET() {
  try {
    const trackCodes = [
      "002085", // 万丰奥威 (低空经济超短龙头)
      "001696", // 宗申动力 (低空动力小市值妖股)
      "000099", // 中信海直 (低空运营高弹性)
      "000158", // 常山北明 (鸿蒙/华为超短连板)
      "300476", // 胜宏科技 (算力板)
      "600584", // 长电科技 (封测中军)
      "002475", // 立讯精密 (消费电子)
      "000977", // 浪潮信息 (AI算力)
      "000998", // 隆平高科 (农业防守)
      "600900", // 长江电力 (高股息水电)
      "601985", // 中国核电 (公用事业)
      "600036", // 招商银行 (红利银行)
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
      rules_checked: "T+1、无未来函数、不买ST/科创板、激进型中小市值且持仓≤2只支持100%满仓单挑、透明100分量化拆解",
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
