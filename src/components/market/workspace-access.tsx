"use client";

import { useState } from "react";
import { LockKeyhole, LogOut, User, KeyRound, ShieldCheck, Sparkles, ArrowRight, Eye, EyeOff } from "lucide-react";

export function WorkspaceLogin({ configured }: { configured: boolean }) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [register, setRegister] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-b from-[#030712] via-[#06111f] to-[#02050a] text-white">
      {/* 氛围渐变光晕背景 */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-[400px] h-[300px] bg-blue-600/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md rounded-3xl bg-gradient-to-br from-[#0c182b]/95 via-[#091220]/95 to-[#0d1c33]/95 border border-cyan-500/30 p-7 sm:p-8 shadow-[0_0_50px_rgba(6,182,212,0.15)] backdrop-blur-2xl relative z-10 space-y-6 animate-in fade-in zoom-in-95 duration-300">
        {/* 顶部系统标识 */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            CHEN TECH STUDIO · 量化投研终端
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            {register ? "创建量化投研账号" : "登录投研工作台"}
          </h1>
          <p className="text-xs text-slate-400">
            登录后即可同步查看三大公有策略实盘推演与管理个人专属持仓
          </p>
        </div>

        {/* 登录 / 注册 模式快速切换分段器 */}
        <div className="grid grid-cols-2 p-1 rounded-xl bg-[#060c16] border border-cyan-900/50 text-xs">
          <button
            type="button"
            onClick={() => {
              setRegister(false);
              setError("");
            }}
            className={`py-2 rounded-lg font-semibold transition-all cursor-pointer ${
              !register
                ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-[0_0_12px_rgba(6,182,212,0.3)]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            账号登录
          </button>
          <button
            type="button"
            onClick={() => {
              setRegister(true);
              setError("");
            }}
            className={`py-2 rounded-lg font-semibold transition-all cursor-pointer ${
              register
                ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-[0_0_12px_rgba(6,182,212,0.3)]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            快速注册
          </button>
        </div>

        <form
          className="space-y-4 text-xs"
          onSubmit={async (event) => {
            event.preventDefault();
            if (busy) return;
            setBusy(true);
            setError("");
            try {
              const response = await fetch("/api-workspace-session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  username,
                  email: username,
                  password,
                  action: register ? "register" : "login",
                }),
              });
              const data = await response.json();
              if (!response.ok) throw new Error(data.error || "登录验证失败");
              setPassword("");
              window.location.assign("/market");
            } catch (err) {
              setError(err instanceof Error ? err.message : "请求处理失败");
            } finally {
              setBusy(false);
            }
          }}
        >
          <div>
            <label className="block text-cyan-200/90 font-medium mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-cyan-400" />
                账号 / 用户名
              </span>
              <span className="text-[10px] text-slate-500">2–64 位字符</span>
            </label>
            <input
              type="text"
              autoComplete="username"
              placeholder="输入您的用户名或账号"
              required
              disabled={!configured || busy}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-cyan-900/60 bg-[#070e18] text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 transition-all font-mono"
            />
          </div>

          <div>
            <label className="block text-cyan-200/90 font-medium mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                密码
              </span>
              <span className="text-[10px] text-cyan-400/80">仅需 6 位密码（无需复杂字符）</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                minLength={6}
                maxLength={128}
                placeholder="输入至少 6 位密码"
                autoComplete={register ? "new-password" : "current-password"}
                required
                disabled={!configured || busy}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-cyan-900/60 bg-[#070e18] text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 transition-all font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-300 transition-colors p-1 cursor-pointer"
                aria-label={showPassword ? "隐藏密码" : "显示密码"}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {!configured && (
            <p role="status" className="text-xs text-amber-400/90 bg-amber-950/30 p-2.5 rounded-xl border border-amber-800/40">
              工作台账户鉴权系统暂未开放，请联系系统管理员。
            </p>
          )}

          {error && (
            <p role="alert" className="text-xs text-rose-300 bg-rose-950/40 p-3 rounded-xl border border-rose-500/40 animate-in fade-in duration-200">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={!configured || busy}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-600 via-cyan-500 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-[0_0_20px_rgba(6,182,212,0.35)] border border-cyan-400/40 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {busy ? (
              <span>正在安全验证中...</span>
            ) : register ? (
              <>
                <span>立即注册并登录</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                <LockKeyhole className="w-3.5 h-3.5" />
                <span>安全登录工作台</span>
              </>
            )}
          </button>

          {/* 隐私与安全信任提示 */}
          <div className="pt-3 border-t border-cyan-900/30 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1 text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              私有持仓数据独立隔离存储
            </span>
            <a href="/privacy" className="text-cyan-400 hover:underline">
              隐私安全说明
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}

export function WorkspaceLogout({ className }: { className?: string }) {
  const [busy, setBusy] = useState(false);

  return (
    <button
      type="button"
      disabled={busy}
      title="安全退出当前量化工作台账号"
      onClick={async () => {
        setBusy(true);
        try {
          await fetch("/api-workspace-session", { method: "DELETE" });
        } finally {
          window.location.assign("/market");
        }
      }}
      className={
        className ||
        "text-xs font-medium px-3.5 py-1.5 rounded-xl bg-[#0c1626] hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 border border-cyan-800/40 hover:border-rose-500/40 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50 group"
      }
    >
      <LogOut className="w-3.5 h-3.5 text-cyan-400 group-hover:text-rose-400 transition-colors" />
      <span>{busy ? "正在退出..." : "退出工作台"}</span>
    </button>
  );
}
