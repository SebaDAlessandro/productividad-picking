import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../utils/cn";

export function Card({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <section
      className={cn(
        "rounded-lg border border-[color:var(--brand-border)] bg-[color:var(--brand-surface)] p-5 shadow-sm",
        className,
      )}
      {...props}
    >
      {children}
    </section>
  );
}
