import { NextResponse } from "next/server";
import { getRealStockQuotes } from "@/lib/quotes-service";

type Suggestion = {
  Classify?: string;
  SecurityTypeName?: string;
  Code?: string;
  Name?: string;
  PinYin?: string;
};

interface SearchBaseItem {
  code: string;
  name: string;
  market: string;
  pinyin: string;
}

async function searchViaEastmoney(query: string): Promise<SearchBaseItem[]> {
  try {
    const response = await fetch(
      `https://searchapi.eastmoney.com/api/suggest/get?type=14&token=D43BF722C8E333C90704E3A9F6F6AC15&input=${encodeURIComponent(query)}`,
      { cache: "no-store", signal: AbortSignal.timeout(4500) }
    );
    if (!response.ok) return [];
    const data = await response.json();
    const rows: Suggestion[] = Array.isArray(data?.QuotationCodeTable?.Data)
      ? data.QuotationCodeTable.Data
      : [];
    return rows
      .filter((item) => item.Classify === "AStock" && typeof item.Code === "string" && /^\d{6}$/.test(item.Code))
      .slice(0, 8)
      .map((item) => ({
        code: item.Code!,
        name: item.Name || item.Code!,
        market: item.SecurityTypeName || "",
        pinyin: item.PinYin || "",
      }));
  } catch {
    return [];
  }
}

async function searchViaSina(query: string): Promise<SearchBaseItem[]> {
  try {
    const response = await fetch(
      `https://suggest3.sinajs.cn/suggest/type=11,12,13,14,15&key=${encodeURIComponent(query)}&name=suggestdata`,
      {
        headers: { Referer: "https://finance.sina.com.cn/", "User-Agent": "Mozilla/5.0" },
        cache: "no-store",
        signal: AbortSignal.timeout(4500),
      }
    );
    if (!response.ok) return [];
    const raw = new TextDecoder("gbk").decode(await response.arrayBuffer());
    const match = raw.match(/"([\s\S]*)"/);
    if (!match || !match[1]) return [];
    return match[1]
      .split(";")
      .map((row) => row.split(","))
      .filter((cols) => cols.length >= 5 && /^\d{6}$/.test(cols[2] || ""))
      .slice(0, 8)
      .map((cols) => {
        const symbol = cols[3] || "";
        const market = symbol.startsWith("sh") ? "沪A" : symbol.startsWith("sz") ? "深A" : "A股";
        return {
          code: cols[2],
          name: cols[4] || cols[0] || cols[2],
          market,
          pinyin: (cols[5] || "").toUpperCase(),
        };
      });
  } catch {
    return [];
  }
}

export async function GET(request: Request) {
  const query = (new URL(request.url).searchParams.get("q") || "").trim();
  if (!query) return NextResponse.json({ success: true, items: [], results: [] });
  if (query.length > 64) return NextResponse.json({ error: "搜索内容过长" }, { status: 400 });

  let baseItems = await searchViaEastmoney(query);
  if (!baseItems.length) {
    baseItems = await searchViaSina(query);
  }
  if (!baseItems.length) {
    return NextResponse.json({ success: true, items: [], results: [] });
  }

  const quotes = await getRealStockQuotes(baseItems.map((item) => item.code)).catch(
    () => ({} as Record<string, { current_price?: number; change_pct?: number; timestamp?: string }>)
  );
  const enriched = baseItems.map((item) => ({
    ...item,
    current_price: quotes[item.code]?.current_price ?? null,
    day_change_pct: quotes[item.code]?.change_pct ?? null,
    quote_time: quotes[item.code]?.timestamp ?? null,
  }));

  return NextResponse.json({ success: true, items: enriched, results: enriched });
}
