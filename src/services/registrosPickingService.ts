import { getSupabaseClient } from "../lib/supabase/client";
import type { AuditLog, PickingPause, PickingSession, QualityControl } from "../types/domain";

const sessionSelect = `
  *,
  employee:employees(*),
  court:work_courts(*),
  pauses:picking_pauses(*, reason:pause_reasons(*)),
  quality_control:quality_controls(*)
`;

function numberValue(value: unknown) {
  return Number(value ?? 0);
}

function normalizeQualityControl(value: unknown): QualityControl | null {
  const item = Array.isArray(value) ? value[0] : value;
  if (!item) return null;
  const control = item as QualityControl;
  return {
    ...control,
    change_errors: numberValue(control.change_errors),
    surplus_errors: numberValue(control.surplus_errors),
    missing_errors: numberValue(control.missing_errors),
    total_error_packages: numberValue(control.total_error_packages),
    correct_packages: numberValue(control.correct_packages),
    error_percentage: numberValue(control.error_percentage),
    quality_percentage: numberValue(control.quality_percentage),
  };
}

export function normalizeSession(value: unknown): PickingSession {
  const session = value as PickingSession;
  return {
    ...session,
    planned_packages: numberValue(session.planned_packages),
    expected_packages_per_hour: numberValue(session.expected_packages_per_hour),
    gross_duration_seconds: numberValue(session.gross_duration_seconds),
    pause_duration_seconds: numberValue(session.pause_duration_seconds),
    net_duration_seconds: numberValue(session.net_duration_seconds),
    real_packages_per_hour: numberValue(session.real_packages_per_hour),
    expected_completion_seconds: numberValue(session.expected_completion_seconds),
    productivity_percentage: numberValue(session.productivity_percentage),
    operational_index: session.operational_index === null ? null : numberValue(session.operational_index),
    pauses: ((session.pauses ?? []) as PickingPause[]).map((pause) => ({
      ...pause,
      duration_seconds: numberValue(pause.duration_seconds),
    })),
    quality_control: normalizeQualityControl(session.quality_control),
  };
}

export async function getRegistrosPicking() {
  const { data, error } = await getSupabaseClient()
    .from("picking_sessions")
    .select(sessionSelect)
    .order("started_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(normalizeSession);
}

export async function getRegistroPickingById(sessionId: string) {
  const { data, error } = await getSupabaseClient()
    .from("picking_sessions")
    .select(sessionSelect)
    .eq("id", sessionId)
    .single();

  if (error) throw error;
  return normalizeSession(data);
}

export async function createRegistroPicking(input: Omit<PickingSession, "id" | "created_at" | "updated_at" | "employee" | "court" | "pauses" | "quality_control">) {
  const { data, error } = await getSupabaseClient()
    .from("picking_sessions")
    .insert(input)
    .select(sessionSelect)
    .single();

  if (error) throw error;
  return normalizeSession(data);
}

export async function upsertRegistroPicking(session: PickingSession) {
  const { employee, court, pauses, quality_control, ...payload } = session;
  void employee;
  void court;
  void pauses;
  void quality_control;

  const { data, error } = await getSupabaseClient()
    .from("picking_sessions")
    .upsert(payload, { onConflict: "id" })
    .select(sessionSelect)
    .single();

  if (error) throw error;
  return normalizeSession(data);
}

export async function updateRegistroPicking(sessionId: string, patch: Partial<PickingSession>) {
  const { employee, court, pauses, quality_control, ...payload } = patch;
  void employee;
  void court;
  void pauses;
  void quality_control;

  const { error } = await getSupabaseClient()
    .from("picking_sessions")
    .update(payload)
    .eq("id", sessionId)
    .select("id")
    .single();

  if (error) throw error;
  return getRegistroPickingById(sessionId);
}

export async function deleteRegistroPicking(sessionId: string) {
  const { error } = await getSupabaseClient().from("picking_sessions").delete().eq("id", sessionId);
  if (error) throw error;
}

export async function createPausaPicking(input: Omit<PickingPause, "id" | "created_at" | "reason">) {
  const { data, error } = await getSupabaseClient()
    .from("picking_pauses")
    .insert(input)
    .select("*, reason:pause_reasons(*)")
    .single();

  if (error) throw error;
  return data as PickingPause;
}

export async function updatePausaPicking(pauseId: string, patch: Partial<PickingPause>) {
  const { reason, ...payload } = patch;
  void reason;
  const { data, error } = await getSupabaseClient()
    .from("picking_pauses")
    .update(payload)
    .eq("id", pauseId)
    .select("*, reason:pause_reasons(*)")
    .single();

  if (error) throw error;
  return data as PickingPause;
}

export async function createControlCalidad(input: Omit<QualityControl, "id" | "created_at" | "updated_at" | "total_error_packages" | "correct_packages" | "error_percentage" | "quality_percentage">) {
  const { data, error } = await getSupabaseClient()
    .from("quality_controls")
    .insert(input)
    .select("*")
    .single();

  if (error) throw error;
  return normalizeQualityControl(data) as QualityControl;
}

export async function getAuditLogs() {
  const { data, error } = await getSupabaseClient()
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) throw error;
  return (data ?? []) as AuditLog[];
}
