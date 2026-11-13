// 工作流页面即时骨架屏：layout 需要校验登录会话，加载期间先给出明确反馈
export default function WorkflowLoading() {
  return (
    <div className="container-shell py-10 md:py-14" aria-busy="true" aria-label="工作流加载中">
      <div className="mb-6 flex items-center gap-3 text-sm text-slate-500">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
        <span>正在进入工作流…</span>
      </div>
      <div className="animate-pulse space-y-4">
        <div className="h-9 w-72 max-w-full rounded-xl bg-slate-200/90" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-40 rounded-3xl bg-slate-200/60" />
          ))}
        </div>
      </div>
    </div>
  );
}
