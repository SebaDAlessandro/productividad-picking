import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { can } from "../lib/permissions/roles";

export function ProtectedRoute({ permission }: { permission?: string }) {
  const { profile, loading } = useAuth();
  if (loading) return <div className="p-6">Cargando sesion...</div>;
  if (!profile) return <Navigate to="/login" replace />;
  if (permission && !can(profile, permission)) return <Navigate to="/access-denied" replace />;
  return <Outlet />;
}
