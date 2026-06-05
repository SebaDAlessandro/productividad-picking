import { SUPERADMIN_EMAIL, type RoleName, type UserProfile } from "../../types/domain";

const matrix: Record<RoleName, string[]> = {
  superadmin: ["*"],
  admin: [
    "dashboard:view",
    "reports:view",
    "admin:manage",
    "users:manage",
    "audit:view",
    "controls:write",
    "picking:write",
    "team-picking:manage",
  ],
  supervisor: ["dashboard:view", "reports:view", "controls:write", "picking:view", "team-picking:manage"],
  controlista: ["controls:write", "picking:view", "team-picking:manage"],
  operario: ["picking:write"],
  solo_lectura: ["dashboard:view", "reports:view", "picking:view"],
};

export function normalizeRole(email?: string | null, role?: RoleName | null): RoleName {
  if (email?.toLowerCase() === SUPERADMIN_EMAIL) return "superadmin";
  return role ?? "solo_lectura";
}

export function can(profile: UserProfile | null, permission: string) {
  if (!profile?.is_active) return false;
  const role = normalizeRole(profile.email, profile.role);
  const permissions = matrix[role] ?? [];
  return permissions.includes("*") || permissions.includes(permission);
}

export function canAccessRoleManager(profile: UserProfile | null) {
  return can(profile, "users:manage");
}

export const roleLabels: Record<RoleName, string> = {
  superadmin: "Superadministrador",
  admin: "Administrador",
  supervisor: "Supervisor",
  controlista: "Controlista",
  operario: "Operario",
  solo_lectura: "Solo lectura",
};
