import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import {
  demoAuditLogs,
  demoCourts,
  demoEmployees,
  demoPauseReasons,
  demoSessions,
} from "../lib/supabase/demoData";
import { calculatePickingMetrics, calculateQuality } from "../lib/calculations/picking";
import type {
  AuditLog,
  Employee,
  PauseReason,
  PickingPause,
  PickingSession,
  QualityControl,
  WorkCourt,
} from "../types/domain";

interface OperationsContextValue {
  employees: Employee[];
  courts: WorkCourt[];
  pauseReasons: PauseReason[];
  sessions: PickingSession[];
  auditLogs: AuditLog[];
  startSession: (input: {
    employeeNumber: string;
    plannedPackages: number;
    courtId: string;
    startedAt?: string;
  }) => { session?: PickingSession; error?: string };
  addPause: (sessionId: string, pauseReasonId: string, notes?: string) => void;
  resumeSession: (sessionId: string) => void;
  finishSession: (
    sessionId: string,
    options?: { grossDurationSeconds?: number; finishedAt?: Date },
  ) => { session?: PickingSession; error?: string };
  controlSession: (
    sessionId: string,
    input: {
      changeErrors: number;
      surplusErrors: number;
      missingErrors: number;
      notes?: string;
    },
  ) => { error?: string };
  upsertEmployee: (employee: Employee) => void;
  deleteEmployee: (employeeId: string) => void;
  upsertCourt: (court: WorkCourt) => void;
  deleteCourt: (courtId: string) => void;
  upsertPauseReason: (reason: PauseReason) => void;
  deletePauseReason: (reasonId: string) => void;
  upsertSession: (session: PickingSession) => void;
  deleteSession: (sessionId: string) => void;
}

const OperationsContext = createContext<OperationsContextValue | null>(null);

export function OperationsProvider({ children }: { children: ReactNode }) {
  const [employees, setEmployees] = useState(demoEmployees);
  const [courts, setCourts] = useState(demoCourts);
  const [pauseReasons, setPauseReasons] = useState(demoPauseReasons);
  const [sessions, setSessions] = useState(demoSessions);
  const [auditLogs, setAuditLogs] = useState(demoAuditLogs);

  const addAudit = (action: string, entity: string, entityId: string, next: unknown) => {
    setAuditLogs((current) => [
      {
        id: crypto.randomUUID(),
        user_id: null,
        action,
        entity,
        entity_id: entityId,
        old_value: null,
        new_value: next as Record<string, unknown>,
        created_at: new Date().toISOString(),
      },
      ...current,
    ]);
  };

  const value = useMemo<OperationsContextValue>(
    () => ({
      employees,
      courts,
      pauseReasons,
      sessions,
      auditLogs,
      startSession(input) {
        const employee = employees.find((item) => item.employee_number === input.employeeNumber);
        if (!employee) return { error: "El legajo no existe." };
        if (!employee.is_active) return { error: "El operario esta inactivo." };
        const court = courts.find((item) => item.id === input.courtId);
        if (!court || !court.is_active) return { error: "La cancha no esta activa." };
        if (input.plannedPackages <= 0) return { error: "Los bultos deben ser mayores a cero." };
        const requestedStart = input.startedAt ? new Date(input.startedAt) : new Date();
        const startedAt = Number.isNaN(requestedStart.getTime()) ? new Date() : requestedStart;
        const session: PickingSession = {
          id: crypto.randomUUID(),
          employee_id: employee.id,
          employee_number: employee.employee_number,
          court_id: court.id,
          planned_packages: input.plannedPackages,
          expected_packages_per_hour: court.expected_packages_per_hour,
          started_at: startedAt.toISOString(),
          finished_at: null,
          gross_duration_seconds: 0,
          pause_duration_seconds: 0,
          net_duration_seconds: 0,
          real_packages_per_hour: 0,
          expected_completion_seconds:
            (input.plannedPackages / court.expected_packages_per_hour) * 3600,
          productivity_percentage: 0,
          operational_index: null,
          status: "in_progress",
          created_by: null,
          finalized_by: null,
          created_at: startedAt.toISOString(),
          updated_at: startedAt.toISOString(),
          employee,
          court,
          pauses: [],
        };
        setSessions((current) => [session, ...current]);
        addAudit("start", "picking_sessions", session.id, session);
        return { session };
      },
      addPause(sessionId, pauseReasonId, notes) {
        setSessions((current) =>
          current.map((session) => {
            if (session.id !== sessionId || session.status !== "in_progress") return session;
            const pauseStartedAt = new Date();
            const grossDurationSeconds = Math.max(
              0,
              Math.round((pauseStartedAt.getTime() - new Date(session.started_at).getTime()) / 1000),
            );
            const pause: PickingPause = {
              id: crypto.randomUUID(),
              picking_session_id: sessionId,
              pause_reason_id: pauseReasonId,
              pause_started_at: pauseStartedAt.toISOString(),
              pause_finished_at: null,
              duration_seconds: 0,
              notes: notes || null,
              created_by: null,
              created_at: pauseStartedAt.toISOString(),
              reason: pauseReasons.find((reason) => reason.id === pauseReasonId),
            };
            addAudit("pause", "picking_sessions", sessionId, pause);
            return {
              ...session,
              status: "paused",
              gross_duration_seconds: grossDurationSeconds,
              updated_at: pauseStartedAt.toISOString(),
              pauses: [...(session.pauses ?? []), pause],
            };
          }),
        );
      },
      resumeSession(sessionId) {
        setSessions((current) =>
          current.map((session) => {
            if (session.id !== sessionId || session.status !== "paused") return session;
            const pauses = (session.pauses ?? []).map((pause) => {
              if (pause.pause_finished_at) return pause;
              const finished = new Date();
              return {
                ...pause,
                pause_finished_at: finished.toISOString(),
                duration_seconds: Math.max(
                  0,
                  Math.round((finished.getTime() - new Date(pause.pause_started_at).getTime()) / 1000),
                ),
              };
            });
            addAudit("resume", "picking_sessions", sessionId, { sessionId });
            return { ...session, status: "in_progress", pauses };
          }),
        );
      },
      finishSession(sessionId, options) {
        const found = sessions.find((session) => session.id === sessionId);
        if (!found) return { error: "Actividad no encontrada." };
        if ((found.pauses ?? []).some((pause) => !pause.pause_finished_at)) {
          return { error: "No se puede finalizar con una pausa abierta." };
        }
        const finishedAt = options?.finishedAt ?? new Date();
        const pauseDuration = (found.pauses ?? []).reduce(
          (sum, pause) => sum + pause.duration_seconds,
          0,
        );
        const calculatedMetrics = calculatePickingMetrics({
          plannedPackages: found.planned_packages,
          expectedPackagesPerHour: found.expected_packages_per_hour,
          startedAt: new Date(found.started_at),
          finishedAt,
          pauseDurationSeconds: pauseDuration,
        });
        const grossDurationSeconds = Math.max(
          calculatedMetrics.grossDurationSeconds,
          options?.grossDurationSeconds ?? 0,
        );
        const netDurationSeconds = Math.max(0, grossDurationSeconds - pauseDuration);
        const realPackagesPerHour =
          netDurationSeconds > 0 ? found.planned_packages / (netDurationSeconds / 3600) : 0;
        const productivityPercentage =
          found.expected_packages_per_hour > 0
            ? (realPackagesPerHour / found.expected_packages_per_hour) * 100
            : 0;
        const metrics = {
          ...calculatedMetrics,
          grossDurationSeconds,
          pauseDurationSeconds: pauseDuration,
          netDurationSeconds,
          realPackagesPerHour,
          productivityPercentage,
        };
        const updatedSession: PickingSession = {
          ...found,
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
        setSessions((current) =>
          current.map((session) => (session.id === sessionId ? updatedSession : session)),
        );
        addAudit("finish", "picking_sessions", sessionId, updatedSession);
        return { session: updatedSession };
      },
      controlSession(sessionId, input) {
        const session = sessions.find((item) => item.id === sessionId);
        if (!session) return { error: "Actividad no encontrada." };
        const total = input.changeErrors + input.surplusErrors + input.missingErrors;
        if (total > session.planned_packages) return { error: "Los errores superan los bultos." };
        const quality = calculateQuality(
          session.planned_packages,
          input.changeErrors,
          input.surplusErrors,
          input.missingErrors,
        );
        const control: QualityControl = {
          id: crypto.randomUUID(),
          picking_session_id: sessionId,
          controlled_by: "current-user",
          controlled_at: new Date().toISOString(),
          ...quality,
          notes: input.notes || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setSessions((current) =>
          current.map((item) =>
            item.id === sessionId
              ? {
                  ...item,
                  status: "controlled",
                  quality_control: control,
                  operational_index:
                    (item.productivity_percentage * control.quality_percentage) / 100,
                }
              : item,
          ),
        );
        addAudit("quality_control", "quality_controls", control.id, control);
        return {};
      },
      upsertEmployee(employee) {
        setEmployees((current) =>
          current.some((item) => item.id === employee.id)
            ? current.map((item) => (item.id === employee.id ? employee : item))
            : [employee, ...current],
        );
        addAudit("upsert", "employees", employee.id, employee);
      },
      deleteEmployee(employeeId) {
        setEmployees((current) => current.filter((item) => item.id !== employeeId));
        addAudit("delete", "employees", employeeId, { id: employeeId });
      },
      upsertCourt(court) {
        setCourts((current) =>
          current.some((item) => item.id === court.id)
            ? current.map((item) => (item.id === court.id ? court : item))
            : [court, ...current],
        );
        addAudit("upsert", "work_courts", court.id, court);
      },
      deleteCourt(courtId) {
        setCourts((current) => current.filter((item) => item.id !== courtId));
        addAudit("delete", "work_courts", courtId, { id: courtId });
      },
      upsertPauseReason(reason) {
        setPauseReasons((current) =>
          current.some((item) => item.id === reason.id)
            ? current.map((item) => (item.id === reason.id ? reason : item))
            : [reason, ...current],
        );
        addAudit("upsert", "pause_reasons", reason.id, reason);
      },
      deletePauseReason(reasonId) {
        setPauseReasons((current) => current.filter((item) => item.id !== reasonId));
        addAudit("delete", "pause_reasons", reasonId, { id: reasonId });
      },
      upsertSession(session) {
        setSessions((current) =>
          current.some((item) => item.id === session.id)
            ? current.map((item) => (item.id === session.id ? session : item))
            : [session, ...current],
        );
        addAudit("upsert", "picking_sessions", session.id, session);
      },
      deleteSession(sessionId) {
        setSessions((current) => current.filter((item) => item.id !== sessionId));
        addAudit("delete", "picking_sessions", sessionId, { id: sessionId });
      },
    }),
    [employees, courts, pauseReasons, sessions, auditLogs],
  );

  return <OperationsContext.Provider value={value}>{children}</OperationsContext.Provider>;
}

export function useOperationsData() {
  const context = useContext(OperationsContext);
  if (!context) throw new Error("useOperationsData debe usarse dentro de OperationsProvider");
  return context;
}
