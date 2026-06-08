import type { QualityControl } from "../../types/domain";

export interface PickingMetricsInput {
  plannedPackages: number;
  expectedPackagesPerHour: number;
  startedAt: Date;
  finishedAt: Date;
  pauseDurationSeconds: number;
  qualityPercentage?: number;
}

export interface PickingMetrics {
  grossDurationSeconds: number;
  pauseDurationSeconds: number;
  netDurationSeconds: number;
  realPackagesPerHour: number;
  expectedCompletionSeconds: number;
  productivityPercentage: number;
  operationalIndex: number | null;
}

export function secondsBetween(from: Date, to: Date) {
  return Math.max(0, Math.round((to.getTime() - from.getTime()) / 1000));
}

export function calculatePickingMetrics(input: PickingMetricsInput): PickingMetrics {
  const grossDurationSeconds = secondsBetween(input.startedAt, input.finishedAt);
  const pauseDurationSeconds = Math.max(0, input.pauseDurationSeconds);
  const netDurationSeconds = Math.max(0, grossDurationSeconds - pauseDurationSeconds);
  const hours = netDurationSeconds / 3600;
  const realPackagesPerHour = hours > 0 ? input.plannedPackages / hours : 0;
  const expectedCompletionSeconds =
    input.expectedPackagesPerHour > 0
      ? Math.round((input.plannedPackages / input.expectedPackagesPerHour) * 3600)
      : 0;
  const productivityPercentage =
    input.expectedPackagesPerHour > 0
      ? (realPackagesPerHour / input.expectedPackagesPerHour) * 100
      : 0;
  const operationalIndex =
    typeof input.qualityPercentage === "number"
      ? (productivityPercentage * input.qualityPercentage) / 100
      : null;

  return {
    grossDurationSeconds,
    pauseDurationSeconds,
    netDurationSeconds,
    realPackagesPerHour,
    expectedCompletionSeconds,
    productivityPercentage,
    operationalIndex,
  };
}

export function calculateQuality(
  plannedPackages: number,
  changeErrors: number,
  surplusErrors: number,
  missingErrors: number,
): Pick<
  QualityControl,
  | "change_errors"
  | "surplus_errors"
  | "missing_errors"
  | "total_error_packages"
  | "correct_packages"
  | "error_percentage"
  | "quality_percentage"
> {
  const total_error_packages = changeErrors + surplusErrors + missingErrors;
  const correct_packages = Math.max(0, plannedPackages - total_error_packages);
  const error_percentage =
    plannedPackages > 0 ? (total_error_packages / plannedPackages) * 100 : 0;
  const quality_percentage =
    plannedPackages > 0 ? (correct_packages / plannedPackages) * 100 : 0;

  return {
    change_errors: changeErrors,
    surplus_errors: surplusErrors,
    missing_errors: missingErrors,
    total_error_packages,
    correct_packages,
    error_percentage,
    quality_percentage,
  };
}

export function productivityLight(value: number) {
  if (value >= 100) return "green";
  if (value >= 90) return "yellow";
  return "red";
}

export function qualityLight(value: number) {
  if (value >= 99) return "green";
  if (value >= 97) return "yellow";
  return "red";
}
