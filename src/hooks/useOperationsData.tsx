import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  demoAuditLogs,
  demoCourts,
  demoEmployees,
  demoPauseReasons,
  demoSessions,
} from "../lib/supabase/demoData";
import { isSupabaseConfigured } from "../lib/supabase/client";
import { calculatePickingMetrics, calculateQuality } from "../lib/calculations/picking";
import { useAuth } from "./useAuth";
import {
  deleteCancha,
  getCanchas,
  upsertCancha,
} from "../services/canchasService";
import {
  deleteMotivoPausa,
  getMotivosPausa,
  upsertMotivoPausa,
} from "../services/motivosPausaService";
import {
  deleteOperario,
  getOperarios,
  upsertOperario,
} from "../services/operariosService";
import {
  createControlCalidad,
  createPausaPicking,
  createRegistroPicking,
  deleteRegistroPicking,
  getAuditLogs,
  getRegistrosPicking,
  updatePausaPicking,
  updateRegistroPicking,
  upsertRegistroPicking,
} from "../services/registrosPickingService";
import type {
  AuditLog,
  Employee,
  PauseReason,
  PickingPause,
  PickingSession,
  QualityControl,
  WorkCourt,
} from "../types/domain";

type OperationResult<T = void> = Promise<{ data?: T; error?: string }>;

interface OperationsContextValue {
  employees: Employee[];
  courts: WorkCourt[];
  pauseReasons: PauseReason[];
  sessions: PickingSession[];
  auditLogs: AuditLog[];
  loading: boolean;
  error: string;
  isUsingDemoData: boolean;
  refresh: () => Promise<void>;
  startSession: (input: {
    employeeNumber: string;
    sheetNumber: string;
    plannedPackages: number;
    courtId: string;
    startedAt?: string;
  }) => OperationResult<PickingSession>;
  addPause: (sessionId: string, pauseReasonId: string, notes?: string) => OperationResult<PickingPause>;
  resumeSession: (sessionId: string) => OperationResult<PickingSession>;
  finishSession: (
    sessionId: string,
    options?: { grossDurationSeconds?: number; finishedAt?: Date },
  ) => OperationResult<PickingSession>;
  controlSession: (
    sessionId: string,
    input: {
      changeErrors: number;
      surplusErrors: number;
      missingErrors: number;
      notes?: string;
    },
  ) => OperationResult;
  upsertEmployee: (employee: Employee) => OperationResult<Employee>;
  deleteEmployee: (employeeId: string) => OperationResult;
  upsertCourt: (court: WorkCourt) => OperationResult<WorkCourt>;
  deleteCourt: (courtId: string) => OperationResult;
  upsertPauseReason: (reason: PauseReason) => OperationResult<PauseReason>;
  deletePauseReason: (reasonId: string) => OperationResult;
  upsertSession: (session: PickingSession) => OperationResult<PickingSession>;
  deleteSession: (sessionId: string) => OperationResult;
}

const OperationsContext = createContext<OperationsContextValue | null>(null);

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object") {
    const supabaseError = error as { message?: unknown; details?: unknown; hint?: unknown; code?: unknown };
    const parts = [supabaseError.message, supabaseError.details, supabaseError.hint, supabaseError.code]
      .filter((value): value is string => typeof value === "string" && value.length > 0);
    if (parts.length > 0) return parts.join(" ");
  }
  return "Ocurrio un error al operar con Supabase.";
}

function emptyIfConfigured<T>(demo: T[]) {
  return isSupabaseConfigured ? [] : demo;
}

export function OperationsProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>(() => emptyIfConfigured(demoEmployees));
  const [courts, setCourts] = useState<WorkCourt[]>(() => emptyIfConfigured(demoCourts));
  const [pauseReasons, setPauseReasons] = useState<PauseReason[]>(() => emptyIfConfigured(demoPauseReasons));
  const [sessions, setSessions] = useState<PickingSession[]>(() => emptyIfConfigured(demoSessions));
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => emptyIfConfigured(demoAuditLogs));
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState("");

  const isUsingDemoData = !isSupabaseConfigured;

  const addLocalAudit = useCallback((action: string, entity: string, entityId: string, next: unknown) => {
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
  }, []);

  const refresh = useCallback(async () => {
    if (!isSupabaseConfigured || !profile) return;
    setLoading(true);
    setError("");
    try {
      const [nextEmployees, nextCourts, nextPauseReasons, nextSessions, nextAuditLogs] = await Promise.all([
        getOperarios(),
        getCanchas(),
        getMotivosPausa(),
        getRegistrosPicking(),
        getAuditLogs().catch(() => []),
      ]);
      setEmployees(nextEmployees);
      setCourts(nextCourts);
      setPauseReasons(nextPauseReasons);
      setSessions(nextSessions);
      setAuditLogs(nextAuditLogs);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const requireProfileId = useCallback(() => {
    if (!profile?.id) throw new Error("No se encontro el perfil autenticado para auditar la operacion.");
    return profile.id;
  }, [profile]);

  const value = useMemo<OperationsContextValue>(
    () => ({
      employees,
      courts,
      pauseReasons,
      sessions,
      auditLogs,
      loading,
      error,
      isUsingDemoData,
      refresh,
      async startSession(input) {
        const employee = employees.find((item) => item.employee_number === input.employeeNumber);
        if (!employee) return { error: "El legajo no existe." };
        if (!employee.is_active) return { error: "El operario esta inactivo." };
        const court = courts.find((item) => item.id === input.courtId);
        if (!court || !court.is_active) return { error: "La cancha no esta activa." };
        if (!input.sheetNumber.trim()) return { error: "El Nro de Planilla es obligatorio." };
        if (input.plannedPackages <= 0) return { error: "Los bultos deben ser mayores a cero." };

        const requestedStart = input.startedAt ? new Date(input.startedAt) : new Date();
        const startedAt = Number.isNaN(requestedStart.getTime()) ? new Date() : requestedStart;
        const sessionPayload = {
          employee_id: employee.id,
          employee_number: employee.employee_number,
          sheet_number: input.sheetNumber.trim(),
          court_id: court.id,
          planned_packages: input.plannedPackages,
          expected_packages_per_hour: court.expected_packages_per_hour,
          started_at: startedAt.toISOString(),
          finished_at: null,
          gross_duration_seconds: 0,
          pause_duration_seconds: 0,
          net_duration_seconds: 0,
          real_packages_per_hour: 0,
          expected_completion_seconds: Math.round((input.plannedPackages / court.expected_packages_per_hour) * 3600),
          productivity_percentage: 0,
          operational_index: null,
          status: "in_progress" as const,
          created_by: profile?.id ?? null,
          finalized_by: null,
        };

        if (isUsingDemoData) {
          const session: PickingSession = {
            id: crypto.randomUUID(),
            ...sessionPayload,
            created_at: startedAt.toISOString(),
            updated_at: startedAt.toISOString(),
            employee,
            court,
            pauses: [],
          };
          setSessions((current) => [session, ...current]);
          addLocalAudit("start", "picking_sessions", session.id, session);
          return { data: session };
        }

        try {
          const session = await createRegistroPicking(sessionPayload);
          setSessions((current) => [session, ...current]);
          void getAuditLogs().then(setAuditLogs).catch(() => undefined);
          return { data: session };
        } catch (startError) {
          return { error: getErrorMessage(startError) };
        }
      },
      async addPause(sessionId, pauseReasonId, notes) {
        const session = sessions.find((item) => item.id === sessionId);
        if (!session || session.status !== "in_progress") return { error: "La actividad no esta en curso." };
        const pauseStartedAt = new Date();
        const grossDurationSeconds = Math.max(
          0,
          Math.round((pauseStartedAt.getTime() - new Date(session.started_at).getTime()) / 1000),
        );
        const pausePayload = {
          picking_session_id: sessionId,
          pause_reason_id: pauseReasonId,
          pause_started_at: pauseStartedAt.toISOString(),
          pause_finished_at: null,
          duration_seconds: 0,
          notes: notes || null,
          created_by: profile?.id ?? null,
        };

        if (isUsingDemoData) {
          const pause: PickingPause = {
            id: crypto.randomUUID(),
            ...pausePayload,
            created_at: pauseStartedAt.toISOString(),
            reason: pauseReasons.find((reason) => reason.id === pauseReasonId),
          };
          setSessions((current) =>
            current.map((item) =>
              item.id === sessionId
                ? { ...item, status: "paused", gross_duration_seconds: grossDurationSeconds, pauses: [...(item.pauses ?? []), pause] }
                : item,
            ),
          );
          addLocalAudit("pause", "picking_sessions", sessionId, pause);
          return { data: pause };
        }

        try {
          const pause = await createPausaPicking(pausePayload);
          const updatedSession = await updateRegistroPicking(sessionId, {
            status: "paused",
            gross_duration_seconds: grossDurationSeconds,
          });
          setSessions((current) => current.map((item) => (item.id === sessionId ? updatedSession : item)));
          return { data: pause };
        } catch (pauseError) {
          return { error: getErrorMessage(pauseError) };
        }
      },
      async resumeSession(sessionId) {
        const session = sessions.find((item) => item.id === sessionId);
        if (!session || session.status !== "paused") return { error: "La actividad no esta pausada." };
        const openPause = (session.pauses ?? []).find((pause) => !pause.pause_finished_at);
        if (!openPause) return { error: "No se encontro una pausa abierta." };
        const finished = new Date();
        const duration = Math.max(
          0,
          Math.round((finished.getTime() - new Date(openPause.pause_started_at).getTime()) / 1000),
        );

        if (isUsingDemoData) {
          const pauses = (session.pauses ?? []).map((pause) =>
            pause.id === openPause.id
              ? { ...pause, pause_finished_at: finished.toISOString(), duration_seconds: duration }
              : pause,
          );
          const updatedSession = { ...session, status: "in_progress" as const, pauses };
          setSessions((current) => current.map((item) => (item.id === sessionId ? updatedSession : item)));
          addLocalAudit("resume", "picking_sessions", sessionId, { sessionId });
          return { data: updatedSession };
        }

        try {
          await updatePausaPicking(openPause.id, {
            pause_finished_at: finished.toISOString(),
            duration_seconds: duration,
          });
          const updatedSession = await updateRegistroPicking(sessionId, { status: "in_progress" });
          setSessions((current) => current.map((item) => (item.id === sessionId ? updatedSession : item)));
          return { data: updatedSession };
        } catch (resumeError) {
          return { error: getErrorMessage(resumeError) };
        }
      },
      async finishSession(sessionId, options) {
        const found = sessions.find((session) => session.id === sessionId);
        if (!found) return { error: "Actividad no encontrada." };
        if ((found.pauses ?? []).some((pause) => !pause.pause_finished_at)) {
          return { error: "No se puede finalizar con una pausa abierta." };
        }
        const finishedAt = options?.finishedAt ?? new Date();
        const pauseDuration = (found.pauses ?? []).reduce((sum, pause) => sum + pause.duration_seconds, 0);
        const calculatedMetrics = calculatePickingMetrics({
          plannedPackages: found.planned_packages,
          expectedPackagesPerHour: found.expected_packages_per_hour,
          startedAt: new Date(found.started_at),
          finishedAt,
          pauseDurationSeconds: pauseDuration,
        });
        const grossDurationSeconds = Math.max(calculatedMetrics.grossDurationSeconds, options?.grossDurationSeconds ?? 0);
        const netDurationSeconds = Math.max(0, grossDurationSeconds - pauseDuration);
        const realPackagesPerHour = netDurationSeconds > 0 ? found.planned_packages / (netDurationSeconds / 3600) : 0;
        const productivityPercentage =
          found.expected_packages_per_hour > 0 ? (realPackagesPerHour / found.expected_packages_per_hour) * 100 : 0;
        const patch = {
          gross_duration_seconds: grossDurationSeconds,
          pause_duration_seconds: pauseDuration,
          net_duration_seconds: netDurationSeconds,
          real_packages_per_hour: realPackagesPerHour,
          expected_completion_seconds: calculatedMetrics.expectedCompletionSeconds,
          productivity_percentage: productivityPercentage,
          operational_index: calculatedMetrics.operationalIndex,
          finished_at: finishedAt.toISOString(),
          status: "finished_pending_control" as const,
          finalized_by: profile?.id ?? null,
        };

        if (isUsingDemoData) {
          const updatedSession = { ...found, ...patch, updated_at: finishedAt.toISOString() };
          setSessions((current) => current.map((session) => (session.id === sessionId ? updatedSession : session)));
          addLocalAudit("finish", "picking_sessions", sessionId, updatedSession);
          return { data: updatedSession };
        }

        try {
          const updatedSession = await updateRegistroPicking(sessionId, patch);
          setSessions((current) => current.map((session) => (session.id === sessionId ? updatedSession : session)));
          return { data: updatedSession };
        } catch (finishError) {
          return { error: getErrorMessage(finishError) };
        }
      },
      async controlSession(sessionId, input) {
        const session = sessions.find((item) => item.id === sessionId);
        if (!session) return { error: "Actividad no encontrada." };
        const total = input.changeErrors + input.surplusErrors + input.missingErrors;
        if (total > session.planned_packages) return { error: "Los errores superan los bultos." };

        if (isUsingDemoData) {
          const quality = calculateQuality(session.planned_packages, input.changeErrors, input.surplusErrors, input.missingErrors);
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
                ? { ...item, status: "controlled", quality_control: control, operational_index: (item.productivity_percentage * control.quality_percentage) / 100 }
                : item,
            ),
          );
          addLocalAudit("quality_control", "quality_controls", control.id, control);
          return {};
        }

        try {
          requireProfileId();
          await createControlCalidad({
            picking_session_id: sessionId,
            controlled_by: profile!.id,
            controlled_at: new Date().toISOString(),
            change_errors: input.changeErrors,
            surplus_errors: input.surplusErrors,
            missing_errors: input.missingErrors,
            notes: input.notes || null,
          });
          const nextSessions = await getRegistrosPicking();
          setSessions(nextSessions);
          void getAuditLogs().then(setAuditLogs).catch(() => undefined);
          return {};
        } catch (controlError) {
          return { error: getErrorMessage(controlError) };
        }
      },
      async upsertEmployee(employee) {
        if (isUsingDemoData) {
          setEmployees((current) => current.some((item) => item.id === employee.id) ? current.map((item) => (item.id === employee.id ? employee : item)) : [employee, ...current]);
          addLocalAudit("upsert", "employees", employee.id, employee);
          return { data: employee };
        }
        try {
          const saved = await upsertOperario(employee);
          setEmployees((current) => current.some((item) => item.id === saved.id) ? current.map((item) => (item.id === saved.id ? saved : item)) : [saved, ...current]);
          return { data: saved };
        } catch (upsertError) {
          return { error: getErrorMessage(upsertError) };
        }
      },
      async deleteEmployee(employeeId) {
        if (isUsingDemoData) {
          setEmployees((current) => current.filter((item) => item.id !== employeeId));
          addLocalAudit("delete", "employees", employeeId, { id: employeeId });
          return {};
        }
        try {
          await deleteOperario(employeeId);
          setEmployees((current) => current.filter((item) => item.id !== employeeId));
          return {};
        } catch (deleteError) {
          return { error: getErrorMessage(deleteError) };
        }
      },
      async upsertCourt(court) {
        if (isUsingDemoData) {
          setCourts((current) => current.some((item) => item.id === court.id) ? current.map((item) => (item.id === court.id ? court : item)) : [court, ...current]);
          addLocalAudit("upsert", "work_courts", court.id, court);
          return { data: court };
        }
        try {
          const saved = await upsertCancha(court);
          setCourts((current) => current.some((item) => item.id === saved.id) ? current.map((item) => (item.id === saved.id ? saved : item)) : [saved, ...current]);
          return { data: saved };
        } catch (upsertError) {
          return { error: getErrorMessage(upsertError) };
        }
      },
      async deleteCourt(courtId) {
        if (isUsingDemoData) {
          setCourts((current) => current.filter((item) => item.id !== courtId));
          addLocalAudit("delete", "work_courts", courtId, { id: courtId });
          return {};
        }
        try {
          await deleteCancha(courtId);
          setCourts((current) => current.filter((item) => item.id !== courtId));
          return {};
        } catch (deleteError) {
          return { error: getErrorMessage(deleteError) };
        }
      },
      async upsertPauseReason(reason) {
        if (isUsingDemoData) {
          setPauseReasons((current) => current.some((item) => item.id === reason.id) ? current.map((item) => (item.id === reason.id ? reason : item)) : [reason, ...current]);
          addLocalAudit("upsert", "pause_reasons", reason.id, reason);
          return { data: reason };
        }
        try {
          const saved = await upsertMotivoPausa(reason);
          setPauseReasons((current) => current.some((item) => item.id === saved.id) ? current.map((item) => (item.id === saved.id ? saved : item)) : [saved, ...current]);
          return { data: saved };
        } catch (upsertError) {
          return { error: getErrorMessage(upsertError) };
        }
      },
      async deletePauseReason(reasonId) {
        if (isUsingDemoData) {
          setPauseReasons((current) => current.filter((item) => item.id !== reasonId));
          addLocalAudit("delete", "pause_reasons", reasonId, { id: reasonId });
          return {};
        }
        try {
          await deleteMotivoPausa(reasonId);
          setPauseReasons((current) => current.filter((item) => item.id !== reasonId));
          return {};
        } catch (deleteError) {
          return { error: getErrorMessage(deleteError) };
        }
      },
      async upsertSession(session) {
        if (isUsingDemoData) {
          setSessions((current) => current.some((item) => item.id === session.id) ? current.map((item) => (item.id === session.id ? session : item)) : [session, ...current]);
          addLocalAudit("upsert", "picking_sessions", session.id, session);
          return { data: session };
        }
        try {
          const saved = await upsertRegistroPicking(session);
          setSessions((current) => current.some((item) => item.id === saved.id) ? current.map((item) => (item.id === saved.id ? saved : item)) : [saved, ...current]);
          return { data: saved };
        } catch (upsertError) {
          return { error: getErrorMessage(upsertError) };
        }
      },
      async deleteSession(sessionId) {
        if (isUsingDemoData) {
          setSessions((current) => current.filter((item) => item.id !== sessionId));
          addLocalAudit("delete", "picking_sessions", sessionId, { id: sessionId });
          return {};
        }
        try {
          await deleteRegistroPicking(sessionId);
          setSessions((current) => current.filter((item) => item.id !== sessionId));
          return {};
        } catch (deleteError) {
          return { error: getErrorMessage(deleteError) };
        }
      },
    }),
    [employees, courts, pauseReasons, sessions, auditLogs, loading, error, isUsingDemoData, refresh, profile, requireProfileId, addLocalAudit],
  );

  return <OperationsContext.Provider value={value}>{children}</OperationsContext.Provider>;
}

export function useOperationsData() {
  const context = useContext(OperationsContext);
  if (!context) throw new Error("useOperationsData debe usarse dentro de OperationsProvider");
  return context;
}
