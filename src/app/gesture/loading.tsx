// 手势互动页面即时骨架屏（three.js 包较大，先给出加载反馈）
export default function GestureLoading() {
  return (
    <div className="container-shell py-10 md:py-14" aria-busy="true" aria-label="手势空间加载中">
      <div className="mb-6 flex items-center gap-3 text-sm text-slate-500">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
        <span>正在加载 3D 手势空间…</span>
      </div>
      <div className="h-[460px] w-full animate-pulse rounded-3xl bg-slate-200/60" />
    </div>
  );
}
