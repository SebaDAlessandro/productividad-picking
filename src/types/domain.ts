export const SUPERADMIN_EMAIL = "sebadalessandro@gmail.com";

export type RoleName =
  | "superadmin"
  | "admin"
  | "supervisor"
  | "controlista"
  | "operario"
  | "solo_lectura";

export type SessionStatus =
  | "draft"
  | "in_progress"
  | "paused"
  | "finished_pending_control"
  | "controlled"
  | "cancelled";

export type ErrorType = "Cambio" | "Sobrante" | "Faltante";

export interface Employee {
  id: string;
  employee_number: string;
  first_name: string;
  last_name: string;
  full_name: string;
  shift: string | null;
  area: string;
  supervisor_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkCourt {
  id: string;
  code: string;
  name: string;
  product_type: string;
  expected_packages_per_hour: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PauseReason {
  id: string;
  name: string;
  description: string | null;
  requires_observation: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PickingSession {
  id: string;
  employee_id: string;
  employee_number: string;
  sheet_number: string | null;
  court_id: string;
  planned_packages: number;
  expected_packages_per_hour: number;
  started_at: string;
  finished_at: string | null;
  gross_duration_seconds: number;
  pause_duration_seconds: number;
  net_duration_seconds: number;
  real_packages_per_hour: number;
  expected_completion_seconds: number;
  productivity_percentage: number;
  operational_index: number | null;
  status: SessionStatus;
  created_by: string | null;
  finalized_by: string | null;
  created_at: string;
  updated_at: string;
  employee?: Employee;
  court?: WorkCourt;
  quality_control?: QualityControl | null;
  pauses?: PickingPause[];
}

export interface PickingPause {
  id: string;
  picking_session_id: string;
  pause_reason_id: string;
  pause_started_at: string;
  pause_finished_at: string | null;
  duration_seconds: number;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  reason?: PauseReason;
}

export interface QualityControl {
  id: string;
  picking_session_id: string;
  controlled_by: string;
  controlled_at: string;
  change_errors: number;
  surplus_errors: number;
  missing_errors: number;
  total_error_packages: number;
  correct_packages: number;
  error_percentage: number;
  quality_percentage: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  auth_user_id: string;
  email: string;
  full_name: string | null;
  role: RoleName;
  employee_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  created_at: string;
}

export interface DashboardFilters {
  from: string;
  to: string;
  shift: string;
  employeeId: string;
  courtId: string;
  supervisorId: string;
  status: string;
  errorType: string;
  pauseReasonId: string;
}
