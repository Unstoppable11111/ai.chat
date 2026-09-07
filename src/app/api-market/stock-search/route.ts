import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get("q") || "").trim();

    if (!query) {
      return NextResponse.json({ success: true, items: [] });
    }

    const suggestUrl = `https://searchapi.eastmoney.com/api/suggest/get?type=14&token=D43BF722C8E333C90704E3A9F6F6AC15&input=${encodeURIComponent(
      query
    )}`;

    const res = await fetch(suggestUrl, {
      cache: "no-store",
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
    });

    if (!res.ok) {
      return NextResponse.json({ success: true, items: [] });
    }

    const json = await res.json();
    const rawItems = json?.QuotationCodeTable?.Data || [];

    // 过滤出 A股 标的（沪A、深A、科创板、创业板）
    const matched = rawItems
      .filter((item: any) => item.Classify === "AStock" || item.SecurityTypeName?.includes("A"))
      .slice(0, 6)
      .map((item: any) => ({
        code: item.Code,
        name: item.Name,
        pinyin: item.PinYin,
        market: item.SecurityTypeName,
        quote_id: item.QuoteID,
      }));

    // 若有匹配项，尝试并发拉取最新现价
    if (matched.length > 0) {
      try {
        const queryCodes = matched.map((m: any) => {
          const prefix = m.code.startsWith("6") ? "sh" : "sz";
          return `${prefix}${m.code}`;
        });
        const quoteRes = await fetch(`https://qt.gtimg.cn/q=${queryCodes.join(",")}`, {
          cache: "no-store",
        });
        if (quoteRes.ok) {
          const text = await quoteRes.text();
          const priceMap: Record<string, { price: number; change_pct: number }> = {};
          for (const line of text.split("\n")) {
            const parts = line.split('="');
            if (parts.length === 2) {
              const fields = parts[1].split("~");
              if (fields.length > 32) {
                const code = fields[2];
                priceMap[code] = {
                  price: parseFloat(fields[3]) || 0,
                  change_pct: parseFloat(fields[32]) || 0,
                };
              }
            }
          }
          return NextResponse.json({
            success: true,
            items: matched.map((m: any) => ({
              ...m,
              current_price: priceMap[m.code]?.price || 0,
              day_change_pct: priceMap[m.code]?.change_pct || 0,
            })),
          });
        }
      } catch {}
    }

    return NextResponse.json({ success: true, items: matched });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "股票联想搜索异常" },
      { status: 500 }
    );
  }
}
