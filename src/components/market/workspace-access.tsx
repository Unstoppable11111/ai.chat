"use client";
import { useState } from "react";
import { LockKeyhole, LogOut } from "lucide-react";

export function WorkspaceLogin({ configured }: { configured: boolean }) {
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [register, setRegister] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return <section className="container-shell py-16 max-w-md">
    <LockKeyhole className="h-6 w-6 mb-4 text-emerald-500" />
    <h1 className="text-2xl font-semibold">{register ? "创建专属量化账户" : "登录投研工作台"}</h1>
    <p className="text-xs text-muted-foreground mt-1">登录后即可同步查看三大公有策略实盘推演与管理个人私有持仓</p>
    <form className="mt-6 space-y-4" onSubmit={async event => {
      event.preventDefault(); setBusy(true); setError("");
      try {
        const response = await fetch("/api-workspace-session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, email: username, password, action: register ? "register" : "login" }) });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "登录失败");
        setPassword(""); window.location.assign("/market");
      } catch (err) { setError(err instanceof Error ? err.message : "登录失败"); }
      finally { setBusy(false); }
    }}>
      <label className="block text-sm font-medium">账号<input type="text" autoComplete="username" placeholder="输入用户名或注册账号" required disabled={!configured || busy} value={username} onChange={e => setUsername(e.target.value)} className="mt-2 w-full rounded-lg border border-slate-200 bg-white p-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900" /></label>
      <label className="block text-sm font-medium">密码（至少 6 位）<input type="password" minLength={6} maxLength={128} placeholder="输入至少 6 位密码" autoComplete={register ? "new-password" : "current-password"} required disabled={!configured || busy} value={password} onChange={e => setPassword(e.target.value)} className="mt-2 w-full rounded-lg border border-slate-200 bg-white p-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900" /></label>
      {!configured && <p role="status" className="text-sm text-muted-foreground">工作台暂未开放。</p>}
      {error && <p role="alert" className="text-sm text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">{error}</p>}
      <button disabled={!configured || busy} className="rounded-lg bg-slate-900 px-5 py-2.5 text-white font-medium hover:bg-slate-800 disabled:opacity-50 transition-colors">{busy ? "处理中…" : register ? "注册账户" : "登录进入"}</button>
      <button type="button" disabled={busy} onClick={() => { setRegister(!register); setError(""); }} className="ml-4 text-sm text-slate-600 hover:text-slate-900 underline">{register ? "已有账户，直接登录" : "没有账号？免费注册"}</button>
      <p className="text-xs text-muted-foreground pt-2"><a href="/privacy" className="underline">账户与数据隐私安全说明</a></p>
    </form>
  </section>;
}

export function WorkspaceLogout() {
  return <button type="button" className="inline-flex items-center gap-2 text-sm" onClick={async () => {
    const response = await fetch("/api-workspace-session", { method: "DELETE" });
    if (response.ok) window.location.assign("/market");
  }}><LogOut className="h-4 w-4" />退出工作台</button>;
}
