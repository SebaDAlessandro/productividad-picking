import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../../utils/cn";

type Variant = "primary" | "secondary" | "danger" | "ghost";

const variants: Record<Variant, string> = {
  primary: "bg-emerald-500 text-slate-950 hover:bg-emerald-400",
  secondary: "bg-slate-700 text-white hover:bg-slate-600 light:bg-slate-200 light:text-slate-900",
  danger: "bg-red-500 text-white hover:bg-red-400",
  ghost: "bg-transparent text-slate-200 hover:bg-slate-800 light:text-slate-800 light:hover:bg-slate-100",
};

export function Button({
  className,
  variant = "primary",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; children: ReactNode }) {
  return (
    <button
      className={cn(
        "inline-flex min-h-10 min-w-28 items-center justify-center gap-2 rounded-md px-4 py-2 text-center text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
