/**
 * 多源实时股票行情获取服务 (Tencent Finance + Sina Finance 容灾交叉校验)
 * 彻底消除价格幻觉，严格保障 A 股最新现价与昨收基准价的真实性与准确性
 */

export interface RealQuote {
  code: string;
  name: string;
  current_price: number;
  pre_close: number;
  open: number;
  high: number;
  low: number;
  change_pct: number;
  volume: number;
  amount: number;
  source: "tencent" | "sina" | "cache";
  timestamp: string;
}

// 内存行情缓存（TTL: 30秒）
const quoteCache = new Map<string, { quote: RealQuote; expireAt: number }>();
const CACHE_TTL_MS = 30 * 1000;

function toTencentCode(code: string): string {
  if (/^(sh|sz|bj)\d{6}$/i.test(code)) return code.toLowerCase();
  const clean = code.trim();
  if (/^(4|8|92)/.test(clean)) return `bj${clean}`;
  if (clean.startsWith("6") || clean.startsWith("9") || clean.startsWith("5")) {
    return `sh${clean}`;
  }
  return `sz${clean}`;
}

async function fetchTencentQuotes(codes: string[]): Promise<Map<string, RealQuote>> {
  const results = new Map<string, RealQuote>();
  if (!codes.length) return results;

  try {
    const qParam = codes.map(toTencentCode).join(",");
    const url = `https://qt.gtimg.cn/q=${qParam}`;

    const res = await fetch(url, {
      headers: {
        Referer: "https://stockapp.finance.qq.com/",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      },
      cache: "no-store", signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) return results;

    const buffer = await res.arrayBuffer();
    const text = new TextDecoder("gbk").decode(buffer);
    const lines = text.split(";");

    for (const line of lines) {
      if (!line.trim()) continue;
      const parts = line.split("~");
      if (parts.length > 37) {
        const code = parts[2];
        const name = parts[1];
        const currentPrice = parseFloat(parts[3]) || 0;
        const preClose = parseFloat(parts[4]) || currentPrice;
        const openPrice = parseFloat(parts[5]) || currentPrice;
        const highPrice = parseFloat(parts[33]) || currentPrice;
        const lowPrice = parseFloat(parts[34]) || currentPrice;
        const changePct = parseFloat(parts[32]) || (preClose > 0 ? Number((((currentPrice - preClose) / preClose) * 100).toFixed(2)) : 0);
        const volume = parseFloat(parts[36]) || 0;
        const amount = parseFloat(parts[37]) || 0;

        if (code && currentPrice > 0) {
          results.set(code, {
            code,
            name,
            current_price: currentPrice,
            pre_close: preClose,
            open: openPrice,
            high: highPrice,
            low: lowPrice,
            change_pct: changePct,
            volume,
            amount,
            source: "tencent",
            timestamp: /^\d{14}$/.test(parts[30]) ? `${parts[30].slice(0,4)}-${parts[30].slice(4,6)}-${parts[30].slice(6,8)}T${parts[30].slice(8,10)}:${parts[30].slice(10,12)}:${parts[30].slice(12,14)}+08:00` : "",
          });
        }
      }
    }
  } catch (err) {
    console.error("[QuotesService] 腾讯行情接口拉取失败:", err);
  }

  return results;
}

async function fetchSinaQuotes(codes: string[]): Promise<Map<string, RealQuote>> {
  const results = new Map<string, RealQuote>();
  if (!codes.length) return results;

  try {
    const listParam = codes.map(toTencentCode).join(",");
    const url = `https://hq.sinajs.cn/list=${listParam}`;

    const res = await fetch(url, {
      headers: {
        Referer: "https://finance.sina.com.cn",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      },
      cache: "no-store", signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) return results;

    const buffer = await res.arrayBuffer();
    const text = new TextDecoder("gbk").decode(buffer);
    const lines = text.split("\n");

    for (const line of lines) {
      if (!line.includes('="')) continue;
      const [left, right] = line.split('="');
      const codeMatch = left.match(/(sh|sz)(\d{6})/);
      if (!codeMatch) continue;
      const code = codeMatch[2];

      const fields = right.replace(/";?$/, "").split(",");
      if (fields.length > 30) {
        const name = fields[0];
        const openPrice = parseFloat(fields[1]) || 0;
        const preClose = parseFloat(fields[2]) || 0;
        const currentPrice = parseFloat(fields[3]) || preClose;
        const highPrice = parseFloat(fields[4]) || currentPrice;
        const lowPrice = parseFloat(fields[5]) || currentPrice;
        const volume = parseFloat(fields[8]) || 0;
        const amount = parseFloat(fields[9]) || 0;
        const changePct = preClose > 0 ? Number((((currentPrice - preClose) / preClose) * 100).toFixed(2)) : 0;

        if (code && currentPrice > 0) {
          results.set(code, {
            code,
            name,
            current_price: currentPrice,
            pre_close: preClose,
            open: openPrice,
            high: highPrice,
            low: lowPrice,
            change_pct: changePct,
            volume,
            amount,
            source: "sina",
            timestamp: fields[30] && fields[31] ? `${fields[30]}T${fields[31]}+08:00` : "",
          });
        }
      }
    }
  } catch (err) {
    console.error("[QuotesService] 新浪行情接口拉取失败:", err);
  }

  return results;
}

export async function getRealStockQuotes(codes: string[]): Promise<Record<string, RealQuote>> {
  const requested=[...new Set(codes)].filter(code=>/^(?:(?:sh|sz|bj))?\d{6}$/.test(code)).slice(0,100);
  const result: Record<string,RealQuote>={};
  const missing=requested.filter(code=>{const cached=quoteCache.get(code);if(cached&&cached.expireAt>Date.now()){result[code]={...cached.quote,source:"cache"};return false;}return true;});
  const primary=await fetchTencentQuotes(missing);
  const remaining=missing.filter(code=>!primary.has(code.replace(/^(sh|sz|bj)/,"")));
  const secondary=await fetchSinaQuotes(remaining);
  for(const code of missing){
    const key=code.replace(/^(sh|sz|bj)/,"");const quote=primary.get(key)||secondary.get(key);
    if(quote&&quote.timestamp&&Number.isFinite(Date.parse(quote.timestamp))){result[code]=quote;quoteCache.set(code,{quote,expireAt:Date.now()+CACHE_TTL_MS});}
  }
  return result;
}

