export default function Loading() {
  return (
    <div className="container-shell py-10 md:py-14 animate-pulse" aria-busy="true" aria-label="页面加载中">
      <div className="mb-8 space-y-3">
        <div className="h-5 w-40 rounded-full bg-slate-200/80" />
        <div className="h-9 w-72 max-w-full rounded-xl bg-slate-200/90" />
        <div className="h-4 w-96 max-w-full rounded-lg bg-slate-200/70" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((item) => (
          <div
            key={item}
            className="luminous-surface rounded-3xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-20 rounded-full bg-slate-200/80" />
              <div className="h-6 w-6 rounded-full bg-slate-200/70" />
            </div>
            <div className="h-6 w-4/5 rounded-lg bg-slate-200/90" />
            <div className="space-y-2">
              <div className="h-3.5 w-full rounded bg-slate-200/70" />
              <div className="h-3.5 w-5/6 rounded bg-slate-200/70" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
