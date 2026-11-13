// 实验室/工坊子页面的即时骨架屏：点击菜单后立刻显示，避免重型客户端包加载期间页面“无反应”
export default function ExperimentsLoading() {
  return (
    <div className="container-shell py-10 md:py-14" aria-busy="true" aria-label="工坊加载中">
      <div className="mb-6 flex items-center gap-3 text-sm text-slate-500">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
        <span>正在进入工坊，资源加载中…</span>
      </div>
      <div className="animate-pulse space-y-6">
        <div className="space-y-3">
          <div className="h-5 w-48 rounded-full bg-slate-200/80" />
          <div className="h-9 w-80 max-w-full rounded-xl bg-slate-200/90" />
          <div className="h-4 w-[28rem] max-w-full rounded-lg bg-slate-200/70" />
        </div>
        <div className="h-[420px] w-full rounded-3xl bg-slate-200/60" />
      </div>
    </div>
  );
}
