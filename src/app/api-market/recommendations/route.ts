import { NextResponse } from "next/server";
import { requestOwner } from "@/lib/server-security";
import {
  listGoldStocks,
  createGoldStock,
  updateGoldStockStatus,
  calcGoldStockStats,
  ensureGoldStockTable,
  STRATEGY_CRITERIA,
  type GoldStockStrategy,
  type GoldStockStatus,
} from "@/lib/gold-stock-db";
import { getRealStockQuotes } from "@/lib/quotes-service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api-market/recommendations
 * 查询金股推荐历史 + 历史成功率统计 + 当前实时行情更新
 * 支持参数: ?strategy=aggressive|balanced|conservative&status=holding|win|stopped|expired
 */
export async function GET(request: Request) {
  await requestOwner(request);

  const url = new URL(request.url);
  const strategy = url.searchParams.get("strategy") as GoldStockStrategy | null;
  const status = url.searchParams.get("status") as GoldStockStatus | null;

  try {
    await ensureGoldStockTable();

    // 1. 查询历史推荐列表
    const records = await listGoldStocks({
      strategy: strategy ?? undefined,
      status: status ?? undefined,
      limit: 100,
    });

    // 2. 对持仓中的推荐实时更新价格和状态
    const holdingRecords = records.filter(r => r.status === "holding");
    if (holdingRecords.length > 0) {
      const codes = [...new Set(holdingRecords.map(r => r.stock_code))];
      try {
        const quotes = await getRealStockQuotes(codes);
        const today = new Date().toISOString().slice(0, 10);

        for (const rec of holdingRecords) {
          const quote = quotes[rec.stock_code];
          if (!quote || !quote.current_price) continue;

          const currentPrice = quote.current_price;
          const returnPct = parseFloat(
            (((currentPrice - rec.entry_price) / rec.entry_price) * 100).toFixed(2)
          );
          const maxReturn = Math.max(returnPct, rec.max_return_pct ?? returnPct);

          // 判定是否触发止盈/止损/到期
          let newStatus: GoldStockStatus = "holding";
          const criteria = STRATEGY_CRITERIA[rec.strategy];
          const daysSince = Math.floor(
            (Date.now() - new Date(rec.recommend_date).getTime()) / (1000 * 60 * 60 * 24)
          );

          if (returnPct >= criteria.win_threshold_pct) {
            newStatus = "win";
          } else if (returnPct <= criteria.stop_loss_pct) {
            newStatus = "stopped";
          } else if (daysSince >= criteria.target_days) {
            newStatus = "expired";
          }

          // 更新数据库
          await updateGoldStockStatus(rec.id, {
            current_price: currentPrice,
            max_return_pct: maxReturn,
            ...(newStatus !== "holding" ? {
              actual_return_pct: returnPct,
              exit_price: currentPrice,
              exit_date: today,
              status: newStatus,
            } : {}),
          });

          // 同步到返回数据
          rec.current_price = currentPrice;
          rec.max_return_pct = maxReturn;
          if (newStatus !== "holding") {
            rec.status = newStatus;
            rec.actual_return_pct = returnPct;
            rec.exit_price = currentPrice;
            rec.exit_date = today;
          }
        }
      } catch {
        // 行情拉取失败，不阻断主流程
      }
    }

    // 3. 计算各策略成功率统计
    const stats = await calcGoldStockStats(strategy ?? undefined);

    return NextResponse.json(
      {
        success: true,
        records,
        stats,
        total: records.length,
        last_updated: new Date().toISOString(),
      },
      {
        headers: { "Cache-Control": "private, no-cache, no-store, must-revalidate" },
      }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "金股推荐查询异常";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/**
 * POST /api-market/recommendations
 * 新增一条金股推荐（需要登录鉴权）
 * Body: { strategy, stock_code, stock_name, sector, entry_price, target_price, stop_loss_price, score, reason }
 */
export async function POST(request: Request) {
  // 需要登录才能添加推荐
  const session = await requestOwner(request);
  if (!session) {
    return NextResponse.json({ success: false, error: "需要登录" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      strategy,
      stock_code,
      stock_name,
      sector,
      entry_price,
      target_price,
      stop_loss_price,
      score,
      reason,
    } = body;

    // 基础校验
    if (!strategy || !stock_code || !stock_name || !entry_price || !target_price || !stop_loss_price) {
      return NextResponse.json(
        { success: false, error: "缺少必填字段: strategy/stock_code/stock_name/entry_price/target_price/stop_loss_price" },
        { status: 400 }
      );
    }
    if (!["aggressive", "balanced", "conservative"].includes(strategy)) {
      return NextResponse.json(
        { success: false, error: "strategy 必须为 aggressive/balanced/conservative" },
        { status: 400 }
      );
    }

    const today = new Date().toISOString().slice(0, 10);
    const result = await createGoldStock({
      strategy: strategy as GoldStockStrategy,
      recommend_date: today,
      stock_code: String(stock_code),
      stock_name: String(stock_name),
      sector: sector ?? "",
      entry_price: Number(entry_price),
      target_price: Number(target_price),
      stop_loss_price: Number(stop_loss_price),
      score: Number(score ?? 0),
      reason: String(reason ?? ""),
    });

    if (!result) {
      return NextResponse.json(
        { success: false, error: "写入数据库失败，请检查数据库连接" },
        { status: 503 }
      );
    }

    return NextResponse.json({ success: true, id: result.id });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "新增金股推荐异常";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
