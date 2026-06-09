import { useEffect, useState } from "react";
import { Database } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { normalizeRole } from "../../lib/permissions/roles";
import {
  getSupabaseDatabaseUsage,
  type SupabaseDatabaseUsage,
} from "../../services/supabaseUsageService";

function formatMb(value: number) {
  return new Intl.NumberFormat("es-AR", {
    maximumFractionDigits: value >= 10 ? 0 : 1,
    minimumFractionDigits: 0,
  }).format(value);
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return "No se pudo cargar el uso.";
}

export function SupabaseUsageMiniCard() {
  const { profile } = useAuth();
  const [usage, setUsage] = useState<SupabaseDatabaseUsage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const isSuperadmin = normalizeRole(profile?.email, profile?.role) === "superadmin";

  useEffect(() => {
    if (!isSuperadmin) return;
    let active = true;
    setLoading(true);
    setError("");
    getSupabaseDatabaseUsage()
      .then((nextUsage) => {
        if (!active) return;
        setUsage(nextUsage);
      })
      .catch((usageError: unknown) => {
        if (!active) return;
        setUsage(null);
        setError(getErrorMessage(usageError));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isSuperadmin]);

  if (!isSuperadmin) return null;

  const percent = Math.max(0, Math.min(100, usage?.usage_percent ?? 0));

  return (
    <section className="mt-auto rounded-lg border border-[color:var(--brand-border)] bg-[color:var(--brand-panel)] p-3 text-xs">
      <div className="flex items-center gap-2">
        <span className="grid size-7 place-items-center rounded-md bg-emerald-500/15 text-emerald-300">
          <Database size={15} />
        </span>
        <div>
          <p className="font-semibold text-slate-100 light:text-slate-900">Supabase</p>
          <p className="text-[color:var(--brand-muted)]">Capacidad BD</p>
        </div>
      </div>
      <div className="mt-3 space-y-2">
        {loading ? (
          <p className="text-[color:var(--brand-muted)]">Cargando uso...</p>
        ) : error ? (
          <p className="text-red-300 light:text-red-600">{error}</p>
        ) : usage ? (
          <>
            <p className="text-slate-200 light:text-slate-800">
              BD usada: {formatMb(usage.database_size_mb)} MB / {formatMb(usage.database_limit_mb)} MB
            </p>
            <p className="text-[color:var(--brand-muted)]">Uso: {formatMb(usage.usage_percent)}%</p>
            <div className="h-2 overflow-hidden rounded-full bg-slate-800 light:bg-slate-200">
              <div
                className="h-full rounded-full bg-emerald-400 transition-all"
                style={{ width: `${percent}%` }}
              />
            </div>
          </>
        ) : (
          <p className="text-[color:var(--brand-muted)]">Sin datos disponibles.</p>
        )}
      </div>
    </section>
  );
}
