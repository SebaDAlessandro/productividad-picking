import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "../../utils/cn";

export function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid min-w-0 gap-2 text-sm">
      <span className="truncate font-medium text-slate-200 light:text-slate-800">{label}</span>
      {children}
      {error ? <span className="text-xs text-red-300 light:text-red-600">{error}</span> : null}
    </label>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  const { className, ...inputProps } = props;
  return (
    <input
      className={cn(
        "min-h-10 min-w-0 w-full rounded-md border border-[color:var(--brand-border)] bg-[color:var(--brand-bg)] px-3 text-sm outline-none ring-emerald-400/40 focus:ring-2",
        className,
      )}
      {...inputProps}
    />
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  const { className, ...selectProps } = props;
  return (
    <select
      className={cn(
        "min-h-10 min-w-0 w-full truncate rounded-md border border-[color:var(--brand-border)] bg-[color:var(--brand-bg)] px-3 text-sm outline-none ring-emerald-400/40 focus:ring-2",
        className,
      )}
      {...selectProps}
    />
  );
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className, ...textareaProps } = props;
  return (
    <textarea
      className={cn(
        "min-h-24 min-w-0 w-full rounded-md border border-[color:var(--brand-border)] bg-[color:var(--brand-bg)] px-3 py-2 text-sm outline-none ring-emerald-400/40 focus:ring-2",
        className,
      )}
      {...textareaProps}
    />
  );
}
