import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Pause, Play, RotateCcw, Square, Trash2, Users } from "lucide-react";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { DataState } from "../../components/ui/DataState";
import { Field, Input, Select } from "../../components/ui/Field";
import { DataTable } from "../../components/tables/DataTable";
import { useOperationsData } from "../../hooks/useOperationsData";
import { toDateTimeLocal } from "../../lib/formatters/date";
import { formatDuration, formatNumber, formatPercent } from "../../lib/formatters/number";
import { formatPickingStatus } from "../../lib/formatters/status";
import type { PickingSession } from "../../types/domain";

type RowDraft = {
  employeeNumber: string;
  plannedPackages: string;
  courtId: string;
  startedAt: string;
};

const operativeStatuses = ["in_progress", "paused", "finished_pending_control"] as const;

export function TeamPickingPage() {
  const {
    employees,
    courts,
    pauseReasons,
    sessions,
    loading,
    error,
    startSession,
    addPause,
    resumeSession,
    finishSession,
    deleteSession,
  } = useOperationsData();
  const [draft, setDraft] = useState<RowDraft>({
    employeeNumber: "",
    plannedPackages: "",
    courtId: courts[0]?.id ?? "",
    startedAt: toDateTimeLocal(new Date()),
  });
  const [pauseInputs, setPauseInputs] = useState<Record<string, { reasonId: string; notes: string }>>({});
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!draft.courtId && courts[0]?.id) {
      setDraft((current) => ({ ...current, courtId: courts[0].id }));
    }
  }, [courts, draft.courtId]);

  const todayKey = format(new Date(), "yyyy-MM-dd");
  const todaySessions = useMemo(
    () =>
      sessions.filter(
        (session) =>
          operativeStatuses.includes(session.status as (typeof operativeStatuses)[number]) &&
          format(new Date(session.started_at), "yyyy-MM-dd") === todayKey,
      ),
    [sessions, todayKey],
  );

  const activeEmployeeNumbers = new Set(
    sessions
      .filter((session) => session.status === "in_progress" || session.status === "paused")
      .map((session) => session.employee_number),
  );

  async function startForEmployee() {
    setMessage("");
    if (!draft.employeeNumber) {
      setMessage("Debe seleccionar un operario.");
      return;
    }
    if (activeEmployeeNumbers.has(draft.employeeNumber)) {
      setMessage("Ese operario ya tiene una actividad en curso o pausada.");
      return;
    }
    const actualStart = new Date();
    const result = await startSession({
      employeeNumber: draft.employeeNumber,
      plannedPackages: Number(draft.plannedPackages),
      courtId: draft.courtId,
      startedAt: actualStart.toISOString(),
    });
    if (result.error) {
      setMessage(result.error);
      return;
    }
    setDraft({
      employeeNumber: "",
      plannedPackages: "",
      courtId: courts[0]?.id ?? "",
      startedAt: toDateTimeLocal(new Date()),
    });
    setMessage("Actividad iniciada por supervisor.");
  }

  async function pause(session: PickingSession) {
    const input = pauseInputs[session.id];
    const fallbackReason =
      pauseReasons.find((reason) => reason.name.toLowerCase() === "otro") ?? pauseReasons[0];
    const reasonId = input?.reasonId || fallbackReason?.id;
    if (!reasonId) {
      setMessage("No hay motivos de pausa configurados.");
      return;
    }
    const result = await addPause(
      session.id,
      reasonId,
      input?.notes || (!input?.reasonId ? "Pausa registrada desde pickeo supervisado." : undefined),
    );
    if (result.error) {
      setMessage(result.error);
      return;
    }
    setMessage(`Actividad pausada: ${session.employee?.full_name ?? session.employee_number}.`);
  }

  async function resume(session: PickingSession) {
    const result = await resumeSession(session.id);
    if (result.error) {
      setMessage(result.error);
      return;
    }
    setMessage(`Actividad reanudada: ${session.employee?.full_name ?? session.employee_number}.`);
  }

  async function finish(session: PickingSession) {
    const result = await finishSession(session.id);
    if (result.error) {
      setMessage(result.error);
      return;
    }
    setMessage(`Actividad finalizada pendiente de control: ${session.employee?.full_name ?? session.employee_number}.`);
  }

  async function remove(session: PickingSession) {
    const employeeName = session.employee?.full_name ?? session.employee_number;
    const confirmed = window.confirm(`Eliminar la actividad de ${employeeName}? Esta accion quedara fuera de la tabla del dia.`);
    if (!confirmed) return;
    const result = await deleteSession(session.id);
    if (result.error) {
      setMessage(result.error);
      return;
    }
    setMessage(`Actividad eliminada: ${employeeName}.`);
  }

  function setPauseInput(sessionId: string, field: "reasonId" | "notes", value: string) {
    setPauseInputs((current) => ({
      ...current,
      [sessionId]: {
        reasonId: current[sessionId]?.reasonId ?? "",
        notes: current[sessionId]?.notes ?? "",
        [field]: value,
      },
    }));
  }

  return (
    <div className="grid gap-6">
      <DataState
        loading={loading}
        error={error}
        empty={!loading && !error && (!employees.length || !courts.length || !pauseReasons.length)}
        emptyText="Faltan datos maestros reales en Supabase para usar pickeo supervisado."
      />
      <Card>
        <h2 className="flex items-center gap-2 text-xl font-bold">
          <Users className="text-emerald-400" />
          Pickeo supervisado
        </h2>
        <p className="mt-2 text-sm text-[color:var(--brand-muted)]">
          Permite que controlista, supervisor, administrador o superadministrador registren y operen varias actividades de pickeo del mismo dia.
        </p>
        <div className="mt-5 grid gap-4 xl:grid-cols-2 2xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
          <Field label="Operario">
            <Select
              value={draft.employeeNumber}
              onChange={(event) => setDraft({ ...draft, employeeNumber: event.target.value })}
            >
              <option value="">Seleccionar operario</option>
              {employees
                .filter((employee) => employee.is_active)
                .map((employee) => (
                  <option key={employee.id} value={employee.employee_number}>
                    {employee.full_name} - Legajo {employee.employee_number}
                  </option>
                ))}
            </Select>
          </Field>
          <Field label="Bultos a pickear">
            <Input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={draft.plannedPackages}
              onChange={(event) => setDraft({ ...draft, plannedPackages: event.target.value.replace(/\D/g, "") })}
              placeholder="Ingresar cantidad"
            />
          </Field>
          <Field label="Cancha">
            <Select value={draft.courtId} onChange={(event) => setDraft({ ...draft, courtId: event.target.value })}>
              {courts.map((court) => (
                <option key={court.id} value={court.id}>
                  {court.name} - {court.product_type}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Fecha y hora del pickeo">
            <Input
              type="datetime-local"
              value={draft.startedAt}
              onChange={(event) => setDraft({ ...draft, startedAt: event.target.value })}
            />
          </Field>
          <div className="flex items-end">
            <Button className="w-full" onClick={startForEmployee}>
              <Play size={18} />
              Iniciar
            </Button>
          </div>
        </div>
        {message ? <p className="mt-4 rounded-md bg-sky-500/10 p-3 text-sm text-sky-300">{message}</p> : null}
      </Card>

      <Card>
        <h3 className="text-lg font-bold">Actividades del dia</h3>
        <p className="mt-2 mb-4 text-sm text-[color:var(--brand-muted)]">
          Muestra cada operario cargado por el supervisor con su estado, cancha, bultos, tiempos y controles operativos por fila.
        </p>
        <DataTable
          data={todaySessions}
          columns={[
            {
              header: "Borrar",
              cell: ({ row }) => (
                <Button variant="danger" onClick={() => remove(row.original)}>
                  <Trash2 size={16} />
                  Borrar
                </Button>
              ),
            },
            { header: "Operario", accessorFn: (row) => row.employee?.full_name ?? row.employee_number },
            { header: "Legajo", accessorKey: "employee_number" },
            { header: "Cancha", accessorFn: (row) => row.court?.name ?? row.court_id },
            { header: "Bultos", accessorKey: "planned_packages" },
            { header: "Inicio", cell: ({ row }) => format(new Date(row.original.started_at), "HH:mm") },
            { header: "Fecha", cell: ({ row }) => format(new Date(row.original.started_at), "dd/MM/yyyy") },
            {
              header: "Estado",
              cell: ({ row }) => (
                <Badge color={row.original.status === "paused" ? "yellow" : row.original.status === "in_progress" ? "green" : "blue"}>
                  {formatPickingStatus(row.original.status)}
                </Badge>
              ),
            },
            {
              header: "Tiempo",
              cell: ({ row }) => {
                const session = row.original;
                const seconds =
                  session.status === "in_progress"
                    ? Math.max(0, Math.round((Date.now() - new Date(session.started_at).getTime()) / 1000))
                    : session.gross_duration_seconds;
                return formatDuration(seconds);
              },
            },
            {
              header: "Productividad",
              cell: ({ row }) =>
                row.original.status === "finished_pending_control"
                  ? `${formatNumber(row.original.real_packages_per_hour, 1)} b/h (${formatPercent(row.original.productivity_percentage)})`
                  : "En curso",
            },
            {
              header: "Pausa",
              cell: ({ row }) => {
                const session = row.original;
                const disabled = session.status !== "in_progress";
                return (
                  <div className="grid min-w-56 gap-2">
                    <Select
                      disabled={disabled}
                      value={pauseInputs[session.id]?.reasonId ?? ""}
                      onChange={(event) => setPauseInput(session.id, "reasonId", event.target.value)}
                    >
                      <option value="">Motivo</option>
                      {pauseReasons.map((reason) => (
                        <option key={reason.id} value={reason.id}>
                          {reason.name}
                        </option>
                      ))}
                    </Select>
                    <Input
                      disabled={disabled}
                      value={pauseInputs[session.id]?.notes ?? ""}
                      onChange={(event) => setPauseInput(session.id, "notes", event.target.value)}
                      placeholder="Observacion"
                    />
                  </div>
                );
              },
            },
            {
              header: "Acciones",
              cell: ({ row }) => {
                const session = row.original;
                return (
                  <div className="flex min-w-80 flex-wrap justify-center gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => pause(session)}
                      disabled={session.status !== "in_progress"}
                    >
                      <Pause size={16} />
                      Pausar
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => resume(session)}
                      disabled={session.status !== "paused"}
                    >
                      <RotateCcw size={16} />
                      Reanudar
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => finish(session)}
                      disabled={session.status !== "in_progress"}
                    >
                      <Square size={16} />
                      Finalizar
                    </Button>
                  </div>
                );
              },
            },
          ]}
        />
      </Card>
    </div>
  );
}
