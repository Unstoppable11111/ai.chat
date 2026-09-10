"use client";

import { useState, useEffect } from "react";
import { LockKeyhole, User, KeyRound, Sparkles, ArrowRight, X, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { useAuth } from "./auth-provider";

function AuthModalDialog({
  initialMode,
  closeAuthModal,
  configured,
  refreshSession,
}: {
  initialMode: "login" | "register";
  closeAuthModal: () => void;
  configured: boolean;
  refreshSession: () => Promise<unknown>;
}) {
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeAuthModal();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeAuthModal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api-workspace-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          email: username.trim(),
          password,
          action: mode,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "验证失败，请重试");
      }
      setPassword("");
      await refreshSession();
      window.dispatchEvent(new CustomEvent("auth-state-changed"));
      closeAuthModal();
      if (typeof window !== "undefined" && window.location.pathname.startsWith("/market")) {
        window.location.reload();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "请求失败，请稍后再试");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 遮罩背景 */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200"
        onClick={closeAuthModal}
      />

      {/* 弹窗主体卡片 */}
      <div className="relative w-full max-w-md rounded-3xl bg-gradient-to-br from-[#0c182b]/98 via-[#091220]/98 to-[#0d1c33]/98 border border-cyan-500/30 p-6 sm:p-8 shadow-[0_0_60px_rgba(6,182,212,0.2)] text-white backdrop-blur-2xl z-10 space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* 关闭按钮 */}
        <button
          type="button"
          onClick={closeAuthModal}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="关闭弹窗"
        >
          <X className="w-4 h-4" />
        </button>

        {/* 顶部系统标识 */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            CHEN TECH STUDIO · 智能通行证
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">
            {mode === "register" ? "创建专属账号" : "登录您的账号"}
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            登录后即可同步专属 AI 对话记忆、解锁量化投研工作台
          </p>
        </div>

        {/* 登录 / 注册 Tab 切换 */}
        <div className="grid grid-cols-2 p-1 rounded-xl bg-[#060c16] border border-cyan-900/50 text-xs">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError("");
            }}
            className={`py-2 rounded-lg font-semibold transition-all cursor-pointer ${
              mode === "login"
                ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-[0_0_12px_rgba(6,182,212,0.3)]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            账号登录
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("register");
              setError("");
            }}
            className={`py-2 rounded-lg font-semibold transition-all cursor-pointer ${
              mode === "register"
                ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-[0_0_12px_rgba(6,182,212,0.3)]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            快速注册
          </button>
        </div>

        {/* 表单 */}
        <form className="space-y-4 text-xs" onSubmit={handleSubmit}>
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
              placeholder="输入用户名或账号"
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
              <span className="text-[10px] text-cyan-400/80">至少 6 位字符</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                minLength={6}
                maxLength={128}
                placeholder="输入密码"
                autoComplete={mode === "register" ? "new-password" : "current-password"}
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
              账户鉴权系统暂未就绪，请稍后访问。
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
              <span>正在验证中...</span>
            ) : mode === "register" ? (
              <>
                <span>立即注册并登录</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                <LockKeyhole className="w-3.5 h-3.5" />
                <span>立即安全登录</span>
              </>
            )}
          </button>

          <div className="pt-2 border-t border-cyan-900/30 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              AI 独有记忆与私有持仓云端隔离
            </span>
            <a href="/privacy" className="text-cyan-400 hover:underline">
              隐私安全
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}

export function AuthModal() {
  const { isAuthModalOpen, authModalMode, closeAuthModal, configured, refreshSession } = useAuth();
  if (!isAuthModalOpen) return null;

  return (
    <AuthModalDialog
      key={`${authModalMode}-${isAuthModalOpen}`}
      initialMode={authModalMode}
      closeAuthModal={closeAuthModal}
      configured={configured}
      refreshSession={refreshSession}
    />
  );
}
