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
    <div className="min-h-[85vh] flex items-center justify-center p-4 pt-24 relative overflow-hidden bg-gradient-to-b from-[#F2F7F9] via-[#F8F8F8] to-[#F8F8F4] text-[#0F0F0F]">
      {/* 柔和氛围渐变背景 */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] bg-[#E0E7D9]/55 blur-[110px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-[400px] h-[300px] bg-[#D8D8E4]/45 blur-[100px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md rounded-3xl bg-[#FFFFFF] border border-[#D8D8E4] p-7 sm:p-8 shadow-[0_24px_60px_rgba(4,35,40,0.08)] relative z-10 space-y-6 animate-in fade-in zoom-in-95 duration-300">
        {/* 顶部系统标识 */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#042328] border border-[#184120] text-[#E1F209] text-xs font-mono font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-[#E1F209] animate-pulse" />
            CHEN TECH STUDIO · 量化投研终端
          </div>
          <h1 className="text-2xl font-black text-[#0F0F0F] tracking-tight">
            {register ? "创建量化投研账号" : "登录投研工作台"}
          </h1>
          <p className="text-xs text-[#263844]">
            登录后即可同步查看三大公有策略实盘推演与管理个人专属持仓
          </p>
        </div>

        {/* 登录 / 注册 模式快速切换分段器 */}
        <div className="grid grid-cols-2 p-1 rounded-xl bg-[#F8F8F4] border border-[#E0E0E0] text-xs">
          <button
            type="button"
            onClick={() => {
              setRegister(false);
              setError("");
            }}
            className={`py-2 rounded-lg font-semibold transition-all cursor-pointer ${
              !register
                ? "bg-[#042328] text-[#FFFFF2] shadow-sm"
                : "text-[#263844] hover:text-[#0F0F0F]"
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
                ? "bg-[#042328] text-[#FFFFF2] shadow-sm"
                : "text-[#263844] hover:text-[#0F0F0F]"
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
            <label className="block text-[#0F0F0F] font-medium mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#042328]" />
                账号 / 用户名
              </span>
              <span className="text-[10px] text-[#263844]/70">2–64 位字符</span>
            </label>
            <input
              type="text"
              autoComplete="username"
              placeholder="输入您的用户名或账号"
              required
              disabled={!configured || busy}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-[#D8D8E4] bg-[#F8F8F4] text-[#0F0F0F] text-xs placeholder:text-[#263844]/50 focus:outline-none focus:bg-[#FFFFFF] focus:border-[#042328] focus:ring-1 focus:ring-[#042328]/20 transition-all font-mono"
            />
          </div>

          <div>
            <label className="block text-[#0F0F0F] font-medium mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-[#042328]" />
                密码
              </span>
              <span className="text-[10px] text-[#184120]">仅需 6 位密码（无需复杂字符）</span>
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
                className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-[#D8D8E4] bg-[#F8F8F4] text-[#0F0F0F] text-xs placeholder:text-[#263844]/50 focus:outline-none focus:bg-[#FFFFFF] focus:border-[#042328] focus:ring-1 focus:ring-[#042328]/20 transition-all font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#263844] hover:text-[#042328] transition-colors p-1 cursor-pointer"
                aria-label={showPassword ? "隐藏密码" : "显示密码"}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {!configured && (
            <p role="status" className="text-xs text-[#282828] bg-[#FFFFF2] p-2.5 rounded-xl border border-[#C8C8C8]">
              工作台账户鉴权系统暂未开放，请联系系统管理员。
            </p>
          )}

          {error && (
            <p role="alert" className="text-xs text-[#D71018] bg-[#D71018]/8 p-3 rounded-xl border border-[#D71018]/30 animate-in fade-in duration-200">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={!configured || busy}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-[#042328] hover:bg-[#184120] text-[#FFFFF2] font-bold text-xs shadow-[0_8px_20px_rgba(4,35,40,0.22)] border border-[#184120] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {busy ? (
              <span>正在安全验证中...</span>
            ) : register ? (
              <>
                <span>立即注册并登录</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#E1F209]" />
              </>
            ) : (
              <>
                <LockKeyhole className="w-3.5 h-3.5 text-[#E1F209]" />
                <span>安全登录工作台</span>
              </>
            )}
          </button>

          {/* 隐私与安全信任提示 */}
          <div className="pt-3 border-t border-[#E4E4E8] flex items-center justify-between text-[11px] text-[#263844]">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#184120]" />
              私有持仓数据独立隔离存储
            </span>
            <a href="/privacy" className="text-[#042328] font-medium hover:underline">
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
        "text-xs font-medium px-3.5 py-1.5 rounded-xl bg-[#FFFFFF]/12 hover:bg-[#D71018]/20 text-[#FFFFF2] border border-[#E0E7D9]/25 hover:border-[#D71018]/60 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50 group"
      }
    >
      <LogOut className="w-3.5 h-3.5 text-[#E0E7D9] group-hover:text-[#FFFFF2] transition-colors" />
      <span>{busy ? "正在退出..." : "退出工作台"}</span>
    </button>
  );
}
