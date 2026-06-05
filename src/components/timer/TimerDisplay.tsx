import { formatDuration } from "../../lib/formatters/number";

export function TimerDisplay({ seconds, paused }: { seconds: number; paused?: boolean }) {
  return (
    <div className="grid gap-2">
      <div
        className="rounded-lg border border-[color:var(--brand-border)] bg-[color:var(--brand-panel)] px-5 py-4 text-center"
        style={paused ? undefined : { animation: "pulse-ring 2s infinite" }}
      >
        <span className="font-mono text-4xl font-bold tabular-nums">{formatDuration(seconds)}</span>
      </div>
      <p className="text-center text-sm text-[color:var(--brand-muted)]">
        {paused ? "Actividad pausada" : "Tiempo bruto desde el inicio"}
      </p>
    </div>
  );
}
