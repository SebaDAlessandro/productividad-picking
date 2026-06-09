import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Activity, AlertTriangle, Clock, Package, Pause, Target, Timer, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { Card } from "../../components/ui/Card";
import { DataState } from "../../components/ui/DataState";
import { Field, Input, Select } from "../../components/ui/Field";
import { KpiCard } from "../../components/kpi/KpiCard";
import { DataTable } from "../../components/tables/DataTable";
import { Badge } from "../../components/ui/Badge";
import { useOperationsData } from "../../hooks/useOperationsData";
import { formatDuration, formatNumber, formatPercent } from "../../lib/formatters/number";
import { formatPickingStatus } from "../../lib/formatters/status";
import { productivityLight, qualityLight } from "../../lib/calculations/picking";
import type { DashboardFilters, Employee, PauseReason, PickingSession, WorkCourt } from "../../types/domain";

const chartColors = ["#12b981", "#38bdf8", "#f7c948", "#ef4444", "#a78bfa", "#fb7185"];

const chartTooltipProps = {
  contentStyle: {
    background: "var(--brand-surface)",
    border: "1px solid var(--brand-border)",
    borderRadius: 8,
    color: "var(--brand-text)",
  },
  labelStyle: {
    color: "var(--brand-text)",
    fontWeight: 700,
    marginBottom: 6,
  },
  itemStyle: {
    color: "var(--brand-text)",
  },
  formatter: (value: unknown, name: unknown) => [
    typeof value === "number" ? formatNumber(value, 1) : String(value),
    String(name),
  ],
};

export function DashboardPage() {
  const { sessions, employees, courts, pauseReasons, loading, error, isUsingDemoData } = useOperationsData();
  const [filters, setFilters] = useState<DashboardFilters>({
    from: "",
    to: "",
    shift: "",
    employeeId: "",
    courtId: "",
    supervisorId: "",
    status: "",
    errorType: "",
    pauseReasonId: "",
  });
  const filteredSessions = useMemo(() => filterSessions(sessions, filters), [sessions, filters]);
  const controlled = filteredSessions.filter((session) => session.status === "controlled");
  const totalPackages = filteredSessions.reduce((sum, item) => sum + item.planned_packages, 0);
  const totalErrors = filteredSessions.reduce(
    (sum, item) => sum + (item.quality_control?.total_error_packages ?? 0),
    0,
  );
  const avgProductivity = avg(filteredSessions.map((item) => item.productivity_percentage));
  const avgQuality = avg(controlled.map((item) => item.quality_control?.quality_percentage ?? 0));
  const avgIndex = avg(controlled.map((item) => item.operational_index ?? 0));
  const netSeconds = filteredSessions.reduce((sum, item) => sum + item.net_duration_seconds, 0);
  const pauseSeconds = filteredSessions.reduce((sum, item) => sum + item.pause_duration_seconds, 0);
  const pauseCount = filteredSessions.reduce((sum, item) => sum + (item.pauses?.length ?? 0), 0);

  const productivityByEmployee = employees
    .map((employee) => {
      const employeeSessions = filteredSessions.filter((session) => session.employee_id === employee.id);
      return {
        name: employee.full_name,
        productividad: avg(employeeSessions.map((session) => session.productivity_percentage)),
        sessionCount: employeeSessions.length,
      };
    })
    .filter((item) => item.sessionCount > 0);

  const productivityByCourt = courts
    .map((court) => {
      const courtSessions = filteredSessions.filter((session) => session.court_id === court.id);
      return {
        name: `${court.name} ${court.product_type}`,
        real: avg(courtSessions.map((session) => session.real_packages_per_hour)),
        esperado: court.expected_packages_per_hour,
        sessionCount: courtSessions.length,
      };
    })
    .filter((item) => item.sessionCount > 0);

  const dailyEvolution = Array.from(
    filteredSessions
      .filter((session) => session.finished_at)
      .reduce((days, session) => {
        const dayKey = format(new Date(session.finished_at ?? session.started_at), "yyyy-MM-dd");
        const current = days.get(dayKey) ?? { date: format(new Date(session.finished_at ?? session.started_at), "dd/MM"), total: 0, count: 0 };
        current.total += session.productivity_percentage;
        current.count += 1;
        days.set(dayKey, current);
        return days;
      }, new Map<string, { date: string; total: number; count: number }>())
      .entries(),
  )
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([, value]) => ({ date: value.date, productividad: value.count ? value.total / value.count : 0 }));

  const dailyErrorsEvolution = Array.from(
    filteredSessions
      .filter((session) => session.finished_at)
      .reduce((days, session) => {
        const dayKey = format(new Date(session.finished_at ?? session.started_at), "yyyy-MM-dd");
        const current = days.get(dayKey) ?? { date: format(new Date(session.finished_at ?? session.started_at), "dd/MM"), errores: 0 };
        current.errores += session.quality_control?.total_error_packages ?? 0;
        days.set(dayKey, current);
        return days;
      }, new Map<string, { date: string; errores: number }>())
      .entries(),
  )
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([, value]) => value);

  const errorsByType = [
    { name: "Cambio", value: sum(controlled, (item) => item.quality_control?.change_errors ?? 0) },
    { name: "Sobrante", value: sum(controlled, (item) => item.quality_control?.surplus_errors ?? 0) },
    { name: "Faltante", value: sum(controlled, (item) => item.quality_control?.missing_errors ?? 0) },
  ];

  const errorsByEmployee = employees
    .map((employee) => {
      const employeeSessions = filteredSessions.filter((session) => session.employee_id === employee.id);
      const errors = sum(employeeSessions, (item) => item.quality_control?.total_error_packages ?? 0);
      const packages = sum(employeeSessions, (item) => item.planned_packages);
      return { name: employee.full_name, errores: errors, porcentaje: packages ? (errors / packages) * 100 : 0, sessionCount: employeeSessions.length };
    })
    .filter((item) => item.sessionCount > 0);

  const pausesByReason = pauseReasons
    .map((reason) => ({
      name: reason.name,
      pausas: filteredSessions.reduce(
        (sumValue, session) =>
          sumValue + (session.pauses ?? []).filter((pause) => pause.pause_reason_id === reason.id).length,
        0,
      ),
    }))
    .filter((item) => item.pausas > 0);

  return (
    <div className="grid gap-6">
      <Filters
        filters={filters}
        onChange={setFilters}
        employees={employees}
        courts={courts}
        pauseReasons={pauseReasons}
      />
      <DataState
        loading={loading}
        error={error}
        empty={!loading && !error && !filteredSessions.length}
        emptyText={sessions.length ? "No hay registros que coincidan con los filtros aplicados." : "Supabase esta conectado, pero todavia no hay registros reales de pickeo para el dashboard."}
      />
      {isUsingDemoData ? (
        <Card>
          <p className="text-sm text-amber-200">Modo demo local: estos datos no provienen de Supabase.</p>
        </Card>
      ) : null}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Productividad promedio" value={formatPercent(avgProductivity)} icon={TrendingUp} />
        <KpiCard title="Eficacia promedio" value={formatPercent(avgQuality)} icon={Target} />
        <KpiCard title="Indice operativo" value={formatPercent(avgIndex)} icon={Activity} />
        <KpiCard title="Bultos pickeados" value={formatNumber(totalPackages)} icon={Package} />
        <KpiCard title="Bultos con error" value={formatNumber(totalErrors)} icon={AlertTriangle} />
        <KpiCard title="Porcentaje error" value={formatPercent(totalPackages ? (totalErrors / totalPackages) * 100 : 0)} icon={AlertTriangle} />
        <KpiCard title="Tiempo neto" value={formatDuration(netSeconds)} icon={Timer} />
        <KpiCard title="Tiempo pausado" value={formatDuration(pauseSeconds)} icon={Pause} />
        <KpiCard title="Cantidad pausas" value={formatNumber(pauseCount)} icon={Pause} />
        <KpiCard title="Tareas finalizadas" value={formatNumber(filteredSessions.length)} icon={Clock} />
        <KpiCard
          title="Pendientes control"
          value={formatNumber(filteredSessions.filter((item) => item.status === "finished_pending_control").length)}
          icon={Target}
        />
      </section>
      <section className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Productividad por operario" text="Muestra la productividad porcentual de cada operario contra el estandar esperado.">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={productivityByEmployee}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" hide />
              <YAxis />
              <Tooltip {...chartTooltipProps} />
              <Bar dataKey="productividad" fill="#12b981" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Productividad por cancha" text="Compara productividad real promedio contra productividad esperada por cancha.">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={productivityByCourt}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" hide />
              <YAxis />
              <Tooltip {...chartTooltipProps} />
              <Legend />
              <Bar dataKey="real" fill="#38bdf8" />
              <Bar dataKey="esperado" fill="#f7c948" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Evolucion diaria de productividad" text="Muestra la evolucion de productividad promedio por dia.">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyEvolution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip {...chartTooltipProps} />
              <Line dataKey="productividad" stroke="#12b981" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Evolucion diaria de errores" text="Muestra el total de errores de pickeo registrados por dia luego del control de calidad.">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyErrorsEvolution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" />
              <YAxis allowDecimals={false} />
              <Tooltip {...chartTooltipProps} />
              <Line dataKey="errores" stroke="#ef4444" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Errores por tipo" text="Distribuye los errores entre Cambio, Sobrante y Faltante.">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={errorsByType} dataKey="value" nameKey="name" innerRadius={70} outerRadius={105} label>
                {errorsByType.map((entry, index) => (
                  <Cell key={entry.name} fill={chartColors[index]} />
                ))}
              </Pie>
              <Tooltip {...chartTooltipProps} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Errores por operario" text="Muestra cantidad y porcentaje de errores por operario.">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={errorsByEmployee} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={110} />
              <Tooltip {...chartTooltipProps} />
              <Bar dataKey="errores" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Pausas por motivo" text="Muestra los motivos de pausa que mas afectan la operacion.">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={pausesByReason}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" hide />
              <YAxis />
              <Tooltip {...chartTooltipProps} />
              <Bar dataKey="pausas" fill="#a78bfa" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>
      <Card>
        <h2 className="text-lg font-bold">Ranking operativo</h2>
        <p className="mt-2 mb-4 text-sm text-[color:var(--brand-muted)]">
          Ordena las actividades por operario, cancha, productividad, eficacia, pausas, errores y estado.
        </p>
        <DataTable
          data={filteredSessions}
          columns={[
            { header: "Operario", accessorFn: (row) => row.employee?.full_name ?? row.employee_number },
            { header: "Legajo", accessorKey: "employee_number" },
            { header: "Nro Planilla", accessorKey: "sheet_number" },
            { header: "Cancha", accessorFn: (row) => row.court?.name ?? row.court_id },
            { header: "Bultos", accessorKey: "planned_packages" },
            {
              header: "Productividad %",
              cell: ({ row }) => (
                <Badge color={productivityLight(row.original.productivity_percentage)}>
                  {formatPercent(row.original.productivity_percentage)}
                </Badge>
              ),
            },
            {
              header: "Eficacia %",
              cell: ({ row }) => {
                const quality = row.original.quality_control?.quality_percentage ?? 0;
                return <Badge color={qualityLight(quality)}>{formatPercent(quality)}</Badge>;
              },
            },
            { header: "Indice", cell: ({ row }) => formatPercent(row.original.operational_index ?? 0) },
            { header: "Tiempo neto", cell: ({ row }) => formatDuration(row.original.net_duration_seconds) },
            { header: "Pausas", cell: ({ row }) => row.original.pauses?.length ?? 0 },
            { header: "Errores", cell: ({ row }) => row.original.quality_control?.total_error_packages ?? 0 },
            { header: "Estado", cell: ({ row }) => <Badge color="blue">{formatPickingStatus(row.original.status)}</Badge> },
          ]}
        />
      </Card>
    </div>
  );
}

function ChartCard({
  title,
  text,
  children,
}: {
  title: string;
  text: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <h2 className="text-lg font-bold">{title}</h2>
      <p className="mt-2 text-sm text-[color:var(--brand-muted)]">{text}</p>
      <div className="mt-4">{children}</div>
    </Card>
  );
}

function Filters({
  filters,
  onChange,
  employees,
  courts,
  pauseReasons,
}: {
  filters: DashboardFilters;
  onChange: (filters: DashboardFilters) => void;
  employees: Employee[];
  courts: WorkCourt[];
  pauseReasons: PauseReason[];
}) {
  const shifts = Array.from(
    new Set(employees.map((employee) => employee.shift ?? "").filter(Boolean)),
  );
  const supervisors = employees.filter((employee) =>
    employees.some((item) => item.supervisor_id === employee.id),
  );
  const update = (patch: Partial<DashboardFilters>) => onChange({ ...filters, ...patch });

  return (
    <Card>
      <h2 className="text-lg font-bold">Filtros del dashboard</h2>
      <p className="mt-2 text-sm text-[color:var(--brand-muted)]">
        Ajusta el periodo y los criterios para recalcular los indicadores y visualizaciones.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-9">
        <Field label="Fecha desde">
          <Input type="date" value={filters.from} onChange={(event) => update({ from: event.target.value })} />
        </Field>
        <Field label="Fecha hasta">
          <Input type="date" value={filters.to} onChange={(event) => update({ to: event.target.value })} />
        </Field>
        <Field label="Turno">
          <Select value={filters.shift} onChange={(event) => update({ shift: event.target.value })}>
            <option value="">Todos</option>
            {shifts.map((shift) => <option key={shift} value={shift}>{shift}</option>)}
          </Select>
        </Field>
        <Field label="Operario">
          <Select value={filters.employeeId} onChange={(event) => update({ employeeId: event.target.value })}>
            <option value="">Todos</option>
            {employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.full_name}</option>)}
          </Select>
        </Field>
        <Field label="Cancha">
          <Select value={filters.courtId} onChange={(event) => update({ courtId: event.target.value })}>
            <option value="">Todas</option>
            {courts.map((court) => <option key={court.id} value={court.id}>{court.name}</option>)}
          </Select>
        </Field>
        <Field label="Supervisor">
          <Select value={filters.supervisorId} onChange={(event) => update({ supervisorId: event.target.value })}>
            <option value="">Todos</option>
            {supervisors.map((supervisor) => <option key={supervisor.id} value={supervisor.id}>{supervisor.full_name}</option>)}
          </Select>
        </Field>
        <Field label="Estado">
          <Select value={filters.status} onChange={(event) => update({ status: event.target.value })}>
            <option value="">Todos</option>
            <option value="draft">Borrador</option>
            <option value="in_progress">En curso</option>
            <option value="paused">Pausada</option>
            <option value="finished_pending_control">Finalizada pendiente de control</option>
            <option value="controlled">Controlada</option>
            <option value="cancelled">Cancelada</option>
          </Select>
        </Field>
        <Field label="Tipo error">
          <Select value={filters.errorType} onChange={(event) => update({ errorType: event.target.value })}>
            <option value="">Todos</option>
            <option value="Cambio">Cambio</option>
            <option value="Sobrante">Sobrante</option>
            <option value="Faltante">Faltante</option>
          </Select>
        </Field>
        <Field label="Motivo pausa">
          <Select value={filters.pauseReasonId} onChange={(event) => update({ pauseReasonId: event.target.value })}>
            <option value="">Todos</option>
            {pauseReasons.map((reason) => <option key={reason.id} value={reason.id}>{reason.name}</option>)}
          </Select>
        </Field>
      </div>
    </Card>
  );
}

function filterSessions(sessions: PickingSession[], filters: DashboardFilters) {
  return sessions.filter((session) => {
    const activityDate = format(new Date(session.finished_at ?? session.started_at), "yyyy-MM-dd");
    if (filters.from && activityDate < filters.from) return false;
    if (filters.to && activityDate > filters.to) return false;
    if (filters.shift && session.employee?.shift !== filters.shift) return false;
    if (filters.employeeId && session.employee_id !== filters.employeeId) return false;
    if (filters.courtId && session.court_id !== filters.courtId) return false;
    if (filters.supervisorId && session.employee?.supervisor_id !== filters.supervisorId) return false;
    if (filters.status && session.status !== filters.status) return false;
    if (filters.pauseReasonId && !(session.pauses ?? []).some((pause) => pause.pause_reason_id === filters.pauseReasonId)) {
      return false;
    }
    if (filters.errorType === "Cambio" && !(session.quality_control?.change_errors ?? 0)) return false;
    if (filters.errorType === "Sobrante" && !(session.quality_control?.surplus_errors ?? 0)) return false;
    if (filters.errorType === "Faltante" && !(session.quality_control?.missing_errors ?? 0)) return false;
    return true;
  });
}

function avg(values: number[]) {
  const filtered = values.filter((value) => Number.isFinite(value) && value > 0);
  return filtered.length ? filtered.reduce((a, b) => a + b, 0) / filtered.length : 0;
}

function sum<T>(items: T[], picker: (item: T) => number) {
  return items.reduce((total, item) => total + picker(item), 0);
}
