import { NextResponse } from "next/server";
import {
  getUserHoldings,
  addUserHolding,
  updateUserHolding,
  deleteUserHolding,
} from "@/lib/portfolio-db";

const PYTHON_API_URL = process.env.QUANT_API_URL || "http://127.0.0.1:8100";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || "default_user";

    const rawHoldings = await getUserHoldings(userId);

    // 调用 Python FastAPI 接口进行实时行情诊断推演
    let diagnosedData: any = null;
    try {
      const resp = await fetch(`${PYTHON_API_URL}/api/v1/portfolio/diagnose`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          holdings: rawHoldings.map((h) => ({
            id: h.id,
            code: h.stock_code,
            name: h.stock_name,
            quantity: h.quantity,
            cost_price: h.cost_price,
            hold_type: h.hold_type,
            notes: h.notes,
          })),
        }),
        cache: "no-store",
      });

      if (resp.ok) {
        diagnosedData = await resp.json();
      }
    } catch {
      // Python 服务未启动时的容错降级
    }

    return NextResponse.json({
      success: true,
      raw_holdings: rawHoldings,
      diagnose: diagnosedData,
      is_live: !!diagnosedData,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "获取持仓异常" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const userId = body.userId || "default_user";
    const stockCode = String(body.stock_code || "").trim().padStart(6, "0");
    let stockName = String(body.stock_name || "").trim();
    const quantity = parseInt(body.quantity, 10) || 100;
    const costPrice = parseFloat(body.cost_price) || 0;
    const holdType = body.hold_type || "core";
    const notes = body.notes || "";

    if (!stockCode || stockCode.length !== 6) {
      return NextResponse.json(
        { success: false, error: "股票代码必须为6位数字" },
        { status: 400 }
      );
    }

    // 如果未填写股票名称，尝试从 Python 实时行情中自动提取股票名
    if (!stockName) {
      try {
        const qResp = await fetch(`${PYTHON_API_URL}/api/v1/stock/quote/${stockCode}`, {
          cache: "no-store",
        });
        if (qResp.ok) {
          const qData = await qResp.json();
          stockName = qData.name || stockCode;
        }
      } catch {
        stockName = stockCode;
      }
    }

    const created = await addUserHolding(userId, {
      stock_code: stockCode,
      stock_name: stockName || stockCode,
      quantity,
      cost_price: costPrice,
      hold_type: holdType,
      notes,
    });

    return NextResponse.json({ success: true, item: created });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "新增持仓异常" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const id = parseInt(body.id, 10);
    const userId = body.userId || "default_user";

    if (!id) {
      return NextResponse.json({ success: false, error: "缺少持仓 ID" }, { status: 400 });
    }

    const patch: any = {};
    if (body.stock_name !== undefined) patch.stock_name = String(body.stock_name);
    if (body.quantity !== undefined) patch.quantity = parseInt(body.quantity, 10);
    if (body.cost_price !== undefined) patch.cost_price = parseFloat(body.cost_price);
    if (body.hold_type !== undefined) patch.hold_type = body.hold_type;
    if (body.notes !== undefined) patch.notes = body.notes;

    const ok = await updateUserHolding(id, userId, patch);
    return NextResponse.json({ success: ok });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "更新持仓异常" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get("id") || "", 10);
    const userId = searchParams.get("userId") || "default_user";

    if (!id) {
      return NextResponse.json({ success: false, error: "缺少持仓 ID" }, { status: 400 });
    }

    const ok = await deleteUserHolding(id, userId);
    return NextResponse.json({ success: ok });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "删除持仓异常" },
      { status: 500 }
    );
  }
}
