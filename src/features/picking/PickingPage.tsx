import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Pause, Play, Square } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Field, Input, Select, Textarea } from "../../components/ui/Field";
import { TimerDisplay } from "../../components/timer/TimerDisplay";
import { useOperationsData } from "../../hooks/useOperationsData";
import { calculatePickingMetrics } from "../../lib/calculations/picking";
import { fromDateTimeLocal, toDateTimeLocal } from "../../lib/formatters/date";
import { formatDuration, formatNumber, formatPercent } from "../../lib/formatters/number";
import type { PickingSession } from "../../types/domain";

export function PickingPage() {
  const { employees, courts, pauseReasons, sessions, startSession, addPause, resumeSession, finishSession } =
    useOperationsData();
  const [employeeNumber, setEmployeeNumber] = useState("");
  const [plannedPackages, setPlannedPackages] = useState("");
  const [courtId, setCourtId] = useState("");
  const [startedAt, setStartedAt] = useState(() => toDateTimeLocal(new Date()));
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [completedSession, setCompletedSession] = useState<PickingSession | null>(null);
  const [pauseReasonId, setPauseReasonId] = useState("");
  const [pauseNotes, setPauseNotes] = useState("");
  const [message, setMessage] = useState("");

  const employee = employees.find((item) => item.employee_number === employeeNumber);
  const court = courts.find((item) => item.id === courtId);
  const plannedPackagesNumber = Number(plannedPackages);
  const expectedSeconds = court ? (plannedPackagesNumber / court.expected_packages_per_hour) * 3600 : 0;
  const activeSession = sessions.find((session) => session.id === activeSessionId) ?? null;
  const summarySession = completedSession ?? activeSession;

  useEffect(() => {
    if (!activeSession || activeSession.status !== "in_progress") return;
    const timer = window.setInterval(() => {
      setElapsed(Math.max(0, Math.round((Date.now() - new Date(activeSession.started_at).getTime()) / 1000)));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [activeSession]);

  const openPause = useMemo(
    () => activeSession?.pauses?.find((pause) => !pause.pause_finished_at),
    [activeSession],
  );

  function begin() {
    const result = startSession({
      employeeNumber,
      plannedPackages: plannedPackagesNumber,
      courtId,
      startedAt: fromDateTimeLocal(startedAt),
    });
    if (result.error) setMessage(result.error);
    if (result.session) {
      setActiveSessionId(result.session.id);
      setCompletedSession(null);
      setElapsed(0);
      setMessage("Actividad iniciada.");
    }
  }

  function resetInputs() {
    setEmployeeNumber("");
    setPlannedPackages("");
    setCourtId("");
    setStartedAt(toDateTimeLocal(new Date()));
    setPauseReasonId("");
    setPauseNotes("");
  }

  function pauseSession() {
    if (!activeSession) return;
    if (!pauseReasonId) {
      setMessage("El motivo de pausa es obligatorio.");
      return;
    }
    addPause(activeSession.id, pauseReasonId, pauseNotes);
    setPauseReasonId("");
    setPauseNotes("");
  }

  function resume() {
    if (!activeSession) return;
    resumeSession(activeSession.id);
  }

  function finish() {
    if (!activeSession) return;
    if (openPause) {
      setMessage("Debe reanudar la actividad antes de finalizar.");
      return;
    }
    const finishedAt = new Date();
    const grossDurationSeconds = Math.max(
      elapsed,
      Math.round((finishedAt.getTime() - new Date(activeSession.started_at).getTime()) / 1000),
    );
    const pauseDurationSeconds = (activeSession.pauses ?? []).reduce(
      (sum, pause) => sum + pause.duration_seconds,
      0,
    );
    const metrics = calculatePickingMetrics({
      plannedPackages: activeSession.planned_packages,
      expectedPackagesPerHour: activeSession.expected_packages_per_hour,
      startedAt: new Date(finishedAt.getTime() - grossDurationSeconds * 1000),
      finishedAt,
      pauseDurationSeconds,
    });
    const localCompletedSession: PickingSession = {
      ...activeSession,
      gross_duration_seconds: metrics.grossDurationSeconds,
      pause_duration_seconds: metrics.pauseDurationSeconds,
      net_duration_seconds: metrics.netDurationSeconds,
      real_packages_per_hour: metrics.realPackagesPerHour,
      expected_completion_seconds: metrics.expectedCompletionSeconds,
      productivity_percentage: metrics.productivityPercentage,
      operational_index: metrics.operationalIndex,
      finished_at: finishedAt.toISOString(),
      status: "finished_pending_control",
      updated_at: finishedAt.toISOString(),
    };
    const result = finishSession(activeSession.id, { finishedAt, grossDurationSeconds });
    if (result.error) setMessage(result.error);
    if (!result.error) {
      const finalSession = result.session?.gross_duration_seconds
        ? result.session
        : localCompletedSession;
      setCompletedSession(finalSession);
      setActiveSessionId(null);
      setElapsed(0);
      resetInputs();
      setMessage("Actividad finalizada pendiente de control.");
    }
  }

  return (
    <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_420px]">
      <Card>
        <h2 className="text-xl font-bold">Inicio de actividad de pickeo</h2>
        <p className="mt-2 text-sm text-[color:var(--brand-muted)]">
          Selecciona el operario, los bultos y la cancha para calcular el tiempo teorico antes de iniciar.
        </p>
        <div className="mt-5 grid gap-4 xl:grid-cols-2 2xl:grid-cols-4">
          <Field label="Operario">
            <Select value={employeeNumber} onChange={(event) => setEmployeeNumber(event.target.value)}>
              <option value="">Seleccionar operario</option>
              {employees
                .filter((item) => item.is_active)
                .map((item) => (
                  <option key={item.id} value={item.employee_number}>
                    {item.full_name} - Legajo {item.employee_number}
                  </option>
                ))}
            </Select>
          </Field>
          <Field label="Bultos a pickear">
            <Input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={plannedPackages}
              onChange={(event) => setPlannedPackages(event.target.value.replace(/\D/g, ""))}
              placeholder="Ingresar cantidad"
            />
          </Field>
          <Field label="Cancha">
            <Select value={courtId} onChange={(event) => setCourtId(event.target.value)}>
              <option value="">Seleccionar cancha</option>
              {courts.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} - {item.product_type}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Fecha y hora del pickeo">
            <Input
              type="datetime-local"
              value={startedAt}
              onChange={(event) => setStartedAt(event.target.value)}
            />
          </Field>
        </div>
        <div className="mt-5 rounded-lg border border-[color:var(--brand-border)] bg-[color:var(--brand-panel)] p-4">
          <h3 className="font-semibold">Confirmacion de datos antes de iniciar</h3>
          <p className="mt-1 text-sm text-[color:var(--brand-muted)]">
            Resume el operario validado, el estandar de la cancha y el tiempo esperado de trabajo.
          </p>
          <dl className="mt-3 grid gap-3 text-sm md:grid-cols-4">
            <Info label="Operario" value={employee?.full_name ?? "Legajo no encontrado"} />
            <Info label="Estado" value={employee?.is_active ? "Activo" : "Inactivo"} />
            <Info label="Estandar cancha" value={`${court?.expected_packages_per_hour ?? 0} bultos/h`} />
            <Info label="Tiempo teorico" value={formatDuration(expectedSeconds)} />
            <Info label="Timestamp" value={startedAt ? startedAt.replace("T", " ") : "Sin fecha"} />
          </dl>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button
            onClick={begin}
            disabled={Boolean(activeSession && ["in_progress", "paused"].includes(activeSession.status))}
          >
            <Play size={18} />
            Iniciar actividad
          </Button>
        </div>
        {message ? <p className="mt-4 rounded-md bg-sky-500/10 p-3 text-sm text-sky-300">{message}</p> : null}
      </Card>
      <Card>
        <h2 className="text-xl font-bold">Cronometro operativo</h2>
        <p className="mt-2 text-sm text-[color:var(--brand-muted)]">
          Mide el tiempo bruto de la actividad y permite registrar pausas con motivo obligatorio.
        </p>
        <div className="mt-5">
          <TimerDisplay seconds={elapsed} paused={activeSession?.status === "paused"} />
        </div>
        <div className="mt-5 grid gap-3">
          <Field label="Motivo de pausa obligatorio">
            <Select value={pauseReasonId} onChange={(event) => setPauseReasonId(event.target.value)}>
              <option value="">Seleccionar</option>
              {pauseReasons.map((reason) => (
                <option key={reason.id} value={reason.id}>
                  {reason.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Observacion">
            <Textarea value={pauseNotes} onChange={(event) => setPauseNotes(event.target.value)} />
          </Field>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={pauseSession} disabled={activeSession?.status !== "in_progress"}>
              <Pause size={18} />
              Pausar
            </Button>
            <Button variant="secondary" onClick={resume} disabled={activeSession?.status !== "paused"}>
              <Play size={18} />
              Reanudar
            </Button>
            <Button variant="danger" onClick={finish} disabled={activeSession?.status !== "in_progress"}>
              <Square size={18} />
              Finalizar
            </Button>
          </div>
        </div>
      </Card>
      {summarySession?.status === "finished_pending_control" ? (
        <Card className="xl:col-span-2">
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <CheckCircle2 className="text-emerald-400" />
            Resumen de actividad finalizada
          </h2>
          <p className="mt-2 text-sm text-[color:var(--brand-muted)]">
            Presenta tiempos calculados y productividad final antes del control de calidad.
          </p>
          <dl className="mt-4 grid gap-3 md:grid-cols-5">
            <Info label="Tiempo bruto" value={formatDuration(summarySession.gross_duration_seconds)} />
            <Info label="Tiempo pausado" value={formatDuration(summarySession.pause_duration_seconds)} />
            <Info label="Tiempo neto" value={formatDuration(summarySession.net_duration_seconds)} />
            <Info label="Productividad real" value={`${formatNumber(summarySession.real_packages_per_hour, 1)} b/h`} />
            <Info label="Productividad %" value={formatPercent(summarySession.productivity_percentage)} />
          </dl>
        </Card>
      ) : null}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase text-[color:var(--brand-muted)]">{label}</dt>
      <dd className="mt-1 font-semibold">{value}</dd>
    </div>
  );
}
