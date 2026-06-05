import { cn } from "../../utils/cn";

const colors = {
  green: "bg-emerald-500/15 text-emerald-300 light:text-emerald-700",
  yellow: "bg-amber-500/15 text-amber-300 light:text-amber-700",
  red: "bg-red-500/15 text-red-300 light:text-red-700",
  blue: "bg-sky-500/15 text-sky-300 light:text-sky-700",
  slate: "bg-slate-500/15 text-slate-300 light:text-slate-700",
};

export function Badge({
  children,
  color = "slate",
}: {
  children: React.ReactNode;
  color?: keyof typeof colors;
}) {
  return (
    <span className={cn("inline-flex rounded px-2 py-1 text-xs font-semibold", colors[color])}>
      {children}
    </span>
  );
}
