"use client";
import { useState } from "react";
import { LockKeyhole, LogOut } from "lucide-react";

export function WorkspaceLogin({ configured }: { configured: boolean }) {
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [register, setRegister] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return <section className="container-shell py-16 max-w-md">
    <LockKeyhole className="h-6 w-6 mb-4" />
    <h1 className="text-2xl font-semibold">{register ? "创建账户" : "登录投研工作台"}</h1>
    <form className="mt-6 space-y-4" onSubmit={async event => {
      event.preventDefault(); setBusy(true); setError("");
      try {
        const response = await fetch("/api-workspace-session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password, action: register ? "register" : "login" }) });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "登录失败");
        setPassword(""); window.location.assign("/market");
      } catch (err) { setError(err instanceof Error ? err.message : "登录失败"); }
      finally { setBusy(false); }
    }}>
      <label className="block text-sm">邮箱<input type="email" autoComplete="username" required disabled={!configured || busy} value={email} onChange={e => setEmail(e.target.value)} className="mt-2 w-full rounded-lg border border-slate-200 bg-white p-3" /></label>
      <label className="block text-sm">密码（至少 12 位）<input type="password" minLength={12} maxLength={128} autoComplete={register ? "new-password" : "current-password"} required disabled={!configured || busy} value={password} onChange={e => setPassword(e.target.value)} className="mt-2 w-full rounded-lg border border-slate-200 bg-white p-3" /></label>
      {!configured && <p role="status" className="text-sm text-muted-foreground">工作台暂未开放。</p>}
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <button disabled={!configured || busy} className="rounded-lg bg-slate-900 px-5 py-2.5 text-white disabled:opacity-50">{busy ? "处理中…" : register ? "注册" : "登录"}</button>
      <button type="button" disabled={busy} onClick={() => { setRegister(!register); setError(""); }} className="ml-4 text-sm underline">{register ? "已有账户，去登录" : "创建账户"}</button>
      <p className="text-xs text-muted-foreground"><a href="/privacy" className="underline">账户与数据隐私</a></p>
    </form>
  </section>;
}

export function WorkspaceLogout() {
  return <button type="button" className="inline-flex items-center gap-2 text-sm" onClick={async () => {
    const response = await fetch("/api-workspace-session", { method: "DELETE" });
    if (response.ok) window.location.assign("/market");
  }}><LogOut className="h-4 w-4" />退出工作台</button>;
}
