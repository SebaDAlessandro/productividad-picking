import { Download } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { DataState } from "../../components/ui/DataState";
import { Field, Input, Select } from "../../components/ui/Field";
import { DataTable } from "../../components/tables/DataTable";
import { Badge } from "../../components/ui/Badge";
import { useOperationsData } from "../../hooks/useOperationsData";
import { formatDuration, formatPercent } from "../../lib/formatters/number";
import { formatPickingStatus } from "../../lib/formatters/status";

export function ReportsPage() {
  const { sessions, employees, courts, pauseReasons, loading, error } = useOperationsData();

  function exportCsv() {
    const rows = [
      ["operario", "legajo", "nro_planilla", "cancha", "bultos", "productividad", "eficacia", "estado"],
      ...sessions.map((session) => [
        session.employee?.full_name ?? "",
        session.employee_number,
        session.sheet_number ?? "",
        session.court?.name ?? "",
        String(session.planned_packages),
        String(session.productivity_percentage),
        String(session.quality_control?.quality_percentage ?? 0),
        session.status,
      ]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "reporte-productividad-pickeo.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="grid gap-6">
      <DataState
        loading={loading}
        error={error}
        empty={!loading && !error && !sessions.length}
        emptyText="No hay registros reales para generar reportes."
      />
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">Reportes filtrables y exportables</h2>
            <p className="text-sm text-[color:var(--brand-muted)]">
              Incluye productividad, errores, pausas, pendientes y consolidado ejecutivo.
            </p>
          </div>
          <Button onClick={exportCsv}>
            <Download size={18} />
            Exportar CSV
          </Button>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-8">
          <Field label="Fecha desde"><Input type="date" /></Field>
          <Field label="Fecha hasta"><Input type="date" /></Field>
          <Field label="Turno"><Select><option>Todos</option><option>Manana</option><option>Tarde</option></Select></Field>
          <Field label="Operario"><Select><option>Todos</option>{employees.map((e) => <option key={e.id}>{e.full_name}</option>)}</Select></Field>
          <Field label="Cancha"><Select><option>Todas</option>{courts.map((c) => <option key={c.id}>{c.name}</option>)}</Select></Field>
          <Field label="Estado"><Select><option>Todos</option><option>Controlada</option><option>Finalizada pendiente de control</option></Select></Field>
          <Field label="Tipo error"><Select><option>Todos</option><option>Cambio</option><option>Sobrante</option><option>Faltante</option></Select></Field>
          <Field label="Motivo pausa"><Select><option>Todos</option>{pauseReasons.map((p) => <option key={p.id}>{p.name}</option>)}</Select></Field>
        </div>
      </Card>
      <Card>
        <h3 className="text-lg font-bold">Reporte ejecutivo consolidado</h3>
        <p className="mt-2 mb-4 text-sm text-[color:var(--brand-muted)]">
          Resume las sesiones con productividad, eficacia, errores, tiempo neto y estado operativo.
        </p>
        <DataTable
          data={sessions}
          columns={[
            { header: "Operario", accessorFn: (row) => row.employee?.full_name ?? row.employee_number },
            { header: "Nro Planilla", accessorKey: "sheet_number" },
            { header: "Cancha", accessorFn: (row) => row.court?.name ?? "" },
            { header: "Bultos", accessorKey: "planned_packages" },
            { header: "Productividad", cell: ({ row }) => formatPercent(row.original.productivity_percentage) },
            { header: "Eficacia", cell: ({ row }) => formatPercent(row.original.quality_control?.quality_percentage ?? 0) },
            { header: "Errores", cell: ({ row }) => row.original.quality_control?.total_error_packages ?? 0 },
            { header: "Tiempo neto", cell: ({ row }) => formatDuration(row.original.net_duration_seconds) },
            { header: "Estado", cell: ({ row }) => <Badge color="blue">{formatPickingStatus(row.original.status)}</Badge> },
          ]}
        />
      </Card>
    </div>
  );
}
