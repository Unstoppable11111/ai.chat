import { NextRequest, NextResponse } from "next/server";
import { requestOwner, sameOrigin } from "@/lib/server-security";

export async function proxy(request: NextRequest) {
  if (!await requestOwner(request)) return NextResponse.json({ success: false, error: "请先登录工作台" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  if (!["GET", "HEAD"].includes(request.method) && !sameOrigin(request)) return NextResponse.json({ success: false, error: "请求来源不允许" }, { status: 403 });
  const response = NextResponse.next();
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
export const config = { matcher: ["/api-portfolio", "/api-market/:path*"] };
