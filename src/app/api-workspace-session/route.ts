import { NextResponse } from "next/server";
import { authConfigured, clientKey, readJsonBody, requestOwner, sameOrigin, sessionToken, SESSION_COOKIE, SESSION_SECONDS, takeQuota } from "@/lib/server-security";
import { checkPassword, findUser, issueSession, registerUser, revokeSession } from "@/lib/auth-db";

export async function GET(request: Request) {
  const userId = await requestOwner(request);
  return NextResponse.json({ authenticated: !!userId, scope: userId || "anonymous", configured: authConfigured() }, { headers: { "Cache-Control": "no-store" } });
}
export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "请求来源不允许" }, { status: 403 });
  if (!authConfigured()) return NextResponse.json({ error: "账户服务暂未就绪" }, { status: 503 });
  try {
    if (!await takeQuota(`login:${clientKey(request)}`, 8, 15 * 60 * 1000)) return NextResponse.json({ error: "尝试过于频繁，请稍后再试" }, { status: 429 });
    const body = await readJsonBody(request, 4096);
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = body.password;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || typeof password !== "string" || password.length < 12 || password.length > 128) return NextResponse.json({ error: "请输入有效邮箱和 12–128 位密码" }, { status: 400 });
    let userId: string;
    if (body.action === "register") {
      if (process.env.ALLOW_REGISTRATION === "false") return NextResponse.json({ error: "当前未开放注册" }, { status: 403 });
      userId = await registerUser(email, password);
    } else {
      const user = await findUser(email);
      // Run the password derivation even when the account does not exist.
      const hash = user?.password_hash || `${"0".repeat(32)}:${"0".repeat(128)}`;
      if (!await checkPassword(password, hash) || !user) return NextResponse.json({ error: "邮箱或密码不正确" }, { status: 401 });
      userId = user.id;
    }
    const response = NextResponse.json({ success: true });
    response.cookies.set(SESSION_COOKIE, await issueSession(userId, SESSION_SECONDS), { httpOnly: true, sameSite: "strict", secure: process.env.COOKIE_SECURE !== "false" && process.env.NODE_ENV === "production", maxAge: SESSION_SECONDS, path: "/" });
    return response;
  } catch (error) {
    const duplicate = (error as { code?: string }).code === "ER_DUP_ENTRY";
    return NextResponse.json({ error: duplicate ? "无法注册该邮箱，请登录或联系站点管理员" : "账户服务暂不可用，请稍后重试" }, { status: duplicate ? 409 : 503 });
  }
}
export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "请求来源不允许" }, { status: 403 });
  try {
    const token = sessionToken(request);
    if (token) await revokeSession(token);
    const response = NextResponse.json({ success: true });
    response.cookies.set(SESSION_COOKIE, "", { httpOnly: true, sameSite: "strict", maxAge: 0, path: "/" });
    return response;
  } catch { return NextResponse.json({ error: "退出失败，请重试" }, { status: 503 }); }
}
