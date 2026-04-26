import { manifesto } from "@/data/site";

export function ManifestoSection() {
  return (
    <section className="studio-section">
      <div className="glass-panel rounded-[34px] p-8 md:p-12">
        <p className="text-xs uppercase tracking-[0.24em] text-brand-violet">理念</p>
        <blockquote className="mt-6 max-w-4xl text-2xl font-medium leading-[1.45] text-foreground md:text-4xl">
          “{manifesto}”
        </blockquote>
      </div>
    </section>
  );
}
