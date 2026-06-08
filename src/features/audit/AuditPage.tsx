import { Card } from "../../components/ui/Card";
import { DataState } from "../../components/ui/DataState";
import { DataTable } from "../../components/tables/DataTable";
import { useOperationsData } from "../../hooks/useOperationsData";

export function AuditPage() {
  const { auditLogs, loading, error } = useOperationsData();
  return (
    <div className="grid gap-6">
      <DataState loading={loading} error={error} empty={!loading && !error && !auditLogs.length} emptyText="No hay auditoria real para mostrar." />
      <Card>
        <h2 className="text-xl font-bold">Auditoria</h2>
        <p className="mt-2 text-sm text-[color:var(--brand-muted)]">
          Registro de altas, ediciones, cambios criticos, acciones operativas y controles de calidad.
        </p>
        <div className="mt-5">
          <DataTable
            data={auditLogs}
            columns={[
              { header: "Fecha", accessorKey: "created_at" },
              { header: "Accion", accessorKey: "action" },
              { header: "Entidad", accessorKey: "entity" },
              { header: "ID", accessorKey: "entity_id" },
              { header: "Detalle", cell: ({ row }) => JSON.stringify(row.original.new_value ?? {}) },
            ]}
          />
        </div>
      </Card>
    </div>
  );
}
