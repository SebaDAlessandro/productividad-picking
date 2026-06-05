import type { PickingSession } from "../../types/domain";

export const pickingStatusLabels: Record<PickingSession["status"], string> = {
  draft: "Borrador",
  in_progress: "En curso",
  paused: "Pausada",
  finished_pending_control: "Finalizada pendiente de control",
  controlled: "Controlada",
  cancelled: "Cancelada",
};

export const pickingStatusOptions = Object.entries(pickingStatusLabels).map(([value, label]) => ({
  value: value as PickingSession["status"],
  label,
}));

export function formatPickingStatus(status: PickingSession["status"]) {
  return pickingStatusLabels[status] ?? status;
}
