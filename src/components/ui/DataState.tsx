import { Card } from "./Card";

export function DataState({
  loading,
  error,
  empty,
  emptyText = "No hay datos para mostrar.",
}: {
  loading?: boolean;
  error?: string;
  empty?: boolean;
  emptyText?: string;
}) {
  if (loading) {
    return (
      <Card>
        <p className="text-sm text-[color:var(--brand-muted)]">Cargando datos reales desde Supabase...</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <p className="text-sm text-red-300">{error}</p>
      </Card>
    );
  }

  if (empty) {
    return (
      <Card>
        <p className="text-sm text-[color:var(--brand-muted)]">{emptyText}</p>
      </Card>
    );
  }

  return null;
}
