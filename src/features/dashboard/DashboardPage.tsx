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
import { Field, Input, Select } from "../../components/ui/Field";
import { KpiCard } from "../../components/kpi/KpiCard";
import { DataTable } from "../../components/tables/DataTable";
import { Badge } from "../../components/ui/Badge";
import { useOperationsData } from "../../hooks/useOperationsData";
import { formatDuration, formatNumber, formatPercent } from "../../lib/formatters/number";
import { formatPickingStatus } from "../../lib/formatters/status";
import { productivityLight, qualityLight } from "../../lib/calculations/picking";

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
  const { sessions, employees, courts, pauseReasons } = useOperationsData();
  const controlled = sessions.filter((session) => session.status === "controlled");
  const totalPackages = sessions.reduce((sum, item) => sum + item.planned_packages, 0);
  const totalErrors = sessions.reduce(
    (sum, item) => sum + (item.quality_control?.total_error_packages ?? 0),
    0,
  );
  const avgProductivity = avg(sessions.map((item) => item.productivity_percentage));
  const avgQuality = avg(controlled.map((item) => item.quality_control?.quality_percentage ?? 0));
  const avgIndex = avg(controlled.map((item) => item.operational_index ?? 0));
  const netSeconds = sessions.reduce((sum, item) => sum + item.net_duration_seconds, 0);
  const pauseSeconds = sessions.reduce((sum, item) => sum + item.pause_duration_seconds, 0);
  const pauseCount = sessions.reduce((sum, item) => sum + (item.pauses?.length ?? 0), 0);

  const productivityByEmployee = employees.map((employee) => ({
    name: employee.full_name,
    productividad: avg(
      sessions
        .filter((session) => session.employee_id === employee.id)
        .map((session) => session.productivity_percentage),
    ),
  }));

  const productivityByCourt = courts.map((court) => ({
    name: `${court.name} ${court.product_type}`,
    real: avg(
      sessions
        .filter((session) => session.court_id === court.id)
        .map((session) => session.real_packages_per_hour),
    ),
    esperado: court.expected_packages_per_hour,
  }));

  const dailyEvolution = sessions.map((session) => ({
    date: session.finished_at ? format(new Date(session.finished_at), "dd/MM") : "Curso",
    productividad: session.productivity_percentage,
  }));

  const dailyErrorsEvolution = Array.from(
    sessions
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

  const errorsByEmployee = employees.map((employee) => {
    const employeeSessions = sessions.filter((session) => session.employee_id === employee.id);
    const errors = sum(employeeSessions, (item) => item.quality_control?.total_error_packages ?? 0);
    const packages = sum(employeeSessions, (item) => item.planned_packages);
    return { name: employee.full_name, errores: errors, porcentaje: packages ? (errors / packages) * 100 : 0 };
  });

  const pausesByReason = pauseReasons.map((reason) => ({
    name: reason.name,
    pausas: sessions.reduce(
      (sumValue, session) =>
        sumValue + (session.pauses ?? []).filter((pause) => pause.pause_reason_id === reason.id).length,
      0,
    ),
  }));

  return (
    <div className="grid gap-6">
      <Filters employees={employees} courts={courts} pauseReasons={pauseReasons} />
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
        <KpiCard title="Tareas finalizadas" value={formatNumber(sessions.length)} icon={Clock} />
        <KpiCard
          title="Pendientes control"
          value={formatNumber(sessions.filter((item) => item.status === "finished_pending_control").length)}
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
          data={sessions}
          columns={[
            { header: "Operario", accessorFn: (row) => row.employee?.full_name ?? row.employee_number },
            { header: "Legajo", accessorKey: "employee_number" },
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
  employees,
  courts,
  pauseReasons,
}: {
  employees: { id: string; full_name: string }[];
  courts: { id: string; name: string }[];
  pauseReasons: { id: string; name: string }[];
}) {
  return (
    <Card>
      <h2 className="text-lg font-bold">Filtros del dashboard</h2>
      <p className="mt-2 text-sm text-[color:var(--brand-muted)]">
        Ajusta el periodo y los criterios para recalcular los indicadores y visualizaciones.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-8">
        <Field label="Fecha desde"><Input type="date" /></Field>
        <Field label="Fecha hasta"><Input type="date" /></Field>
        <Field label="Turno"><Select><option>Todos</option><option>Manana</option><option>Tarde</option></Select></Field>
        <Field label="Operario"><Select><option>Todos</option>{employees.map((e) => <option key={e.id}>{e.full_name}</option>)}</Select></Field>
        <Field label="Cancha"><Select><option>Todas</option>{courts.map((c) => <option key={c.id}>{c.name}</option>)}</Select></Field>
        <Field label="Supervisor"><Select><option>Todos</option></Select></Field>
        <Field label="Estado"><Select><option>Todos</option><option>Controlada</option><option>Finalizada pendiente de control</option></Select></Field>
        <Field label="Motivo pausa"><Select><option>Todos</option>{pauseReasons.map((p) => <option key={p.id}>{p.name}</option>)}</Select></Field>
      </div>
    </Card>
  );
}

function avg(values: number[]) {
  const filtered = values.filter((value) => Number.isFinite(value) && value > 0);
  return filtered.length ? filtered.reduce((a, b) => a + b, 0) / filtered.length : 0;
}

function sum<T>(items: T[], picker: (item: T) => number) {
  return items.reduce((total, item) => total + picker(item), 0);
}
