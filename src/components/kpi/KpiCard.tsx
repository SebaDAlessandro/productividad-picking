import type { LucideIcon } from "lucide-react";

export function KpiCard({
  title,
  value,
  helper,
  icon: Icon,
}: {
  title: string;
  value: string;
  helper?: string;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-lg border border-[color:var(--brand-border)] bg-[color:var(--brand-surface)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--brand-muted)]">
            {title}
          </p>
          <p className="mt-2 text-2xl font-bold">{value}</p>
        </div>
        <span className="grid size-10 place-items-center rounded-md bg-emerald-500/15 text-emerald-300">
          <Icon size={20} />
        </span>
      </div>
      {helper ? <p className="mt-3 text-sm text-[color:var(--brand-muted)]">{helper}</p> : null}
    </div>
  );
}
