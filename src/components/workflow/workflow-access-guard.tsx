"use client";

import { useState } from "react";
import { LockKeyhole, Sparkles, ArrowRight, Eye, EyeOff, BookOpen, Film, Layers } from "lucide-react";
import { useRouter } from "next/navigation";

export function WorkflowAccessGuard({ configured }: { configured: boolean }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [register, setRegister] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("请输入账号和密码");
      return;
    }

    setBusy(true);
    setError("");

    try {
      const res = await fetch("/api-workspace-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: register ? "register" : "login",
          username: username.trim(),
          password,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        setError(data?.error || data?.message || (register ? "注册失败，账号可能已存在" : "登录失败，请检查账号密码"));
        return;
      }

      // 登录/注册成功，刷新当前页面进入工作流
      router.refresh();
      window.location.reload();
    } catch {
      setError("网络服务异常，请稍后重试");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-[88vh] flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-b from-[#030712] via-[#0b0f24] to-[#02050a] text-white">
      {/* 氛围渐变光晕背景 */}

      <div className="w-full max-w-md rounded-3xl bg-gradient-to-br from-[#0e142e]/95 via-[#0c1226]/95 to-[#0b1021]/95 border border-purple-500/30 p-7 sm:p-8 shadow-[0_0_50px_rgba(168,85,247,0.15)]  relative z-10 space-y-6 animate-in fade-in zoom-in-95 duration-300">
        {/* 顶部系统标识 */}
        <div className="text-center space-y-2.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-mono">
            <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
            CHEN TECH STUDIO · 工业化内容引擎
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            {register ? "创建创作者账号" : "登录小说与短剧工作流"}
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            登录后即可无缝使用自动化设定集、正文递推、电影级分镜提示词与云端书架同步
          </p>
        </div>

        {/* 核心亮点标签 */}
        <div className="grid grid-cols-3 gap-2 py-2 border-y border-purple-900/40 text-[11px] text-slate-300 text-center">
          <div className="flex flex-col items-center gap-1">
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <span>长篇自动接力</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Film className="w-4 h-4 text-purple-400" />
            <span>电影级分镜</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>云端书架绑定</span>
          </div>
        </div>

        {/* 登录 / 注册 模式快速切换分段器 */}
        <div className="grid grid-cols-2 p-1 rounded-xl bg-[#080c1d] border border-purple-900/50 text-xs">
          <button
            type="button"
            onClick={() => {
              setRegister(false);
              setError("");
            }}
            className={`py-2 rounded-lg font-semibold transition-all cursor-pointer ${
              !register
                ? "bg-gradient-to-r from-purple-600 to-cyan-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.3)]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            创作者登录
          </button>
          <button
            type="button"
            onClick={() => {
              setRegister(true);
              setError("");
            }}
            className={`py-2 rounded-lg font-semibold transition-all cursor-pointer ${
              register
                ? "bg-gradient-to-r from-purple-600 to-cyan-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.3)]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            免费注册账号
          </button>
        </div>

        {/* 表单主体 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">创作者账号 / 邮箱</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入您的邮箱或用户名"
              className="w-full rounded-xl bg-[#060a17] border border-slate-700/80 px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:border-purple-500 focus:outline-hidden transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">访问密码</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                className="w-full rounded-xl bg-[#060a17] border border-slate-700/80 px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:border-purple-500 focus:outline-hidden transition-colors pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs text-center animate-in fade-in duration-150">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 shadow-[0_0_20px_rgba(147,51,234,0.3)] hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {busy ? (
              <span>正在验证身份...</span>
            ) : (
              <>
                <LockKeyhole className="w-3.5 h-3.5" />
                <span>{register ? "立即注册并开启工作流" : "验证身份并进入工作台"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {!configured && (
          <p className="text-[11px] text-amber-400/80 text-center">
            提示：当前若未配置全局管理密钥，注册首个账号即可自动绑定为主创账号。
          </p>
        )}
      </div>
    </div>
  );
}
