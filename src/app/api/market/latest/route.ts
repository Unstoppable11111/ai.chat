import { NextResponse } from "next/server";

const PYTHON_API_URL = process.env.QUANT_API_URL || "http://127.0.0.1:8100";

export async function GET() {
  try {
    const resp = await fetch(`${PYTHON_API_URL}/api/v1/market/latest`, {
      cache: "no-store",
    });

    if (resp.ok) {
      const data = await resp.json();
      return NextResponse.json({ success: true, ...data });
    }

    return NextResponse.json(
      { success: false, error: "量化服务未就绪" },
      { status: 502 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "无法连接量化微服务",
        market_score: 50,
        market_state: "离线待机",
        suggested_position: "30%~50%",
      },
      { status: 503 }
    );
  }
}
