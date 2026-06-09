import { NavLink, Outlet } from "react-router-dom";
import {
  Activity,
  BarChart3,
  BookOpen,
  ClipboardCheck,
  Database,
  FileText,
  History,
  LogOut,
  Moon,
  Settings,
  Shield,
  Sun,
  Timer,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "../ui/Button";
import { useAuth } from "../../hooks/useAuth";
import { can } from "../../lib/permissions/roles";
import { SupabaseUsageMiniCard } from "./SupabaseUsageMiniCard";

const links = [
  { to: "/", label: "Dashboard", icon: BarChart3, permission: "dashboard:view" },
  { to: "/picking", label: "Pickeo", icon: Timer, permission: "picking:write" },
  { to: "/team-picking", label: "Pickeo supervisado", icon: Users, permission: "team-picking:manage" },
  { to: "/controls", label: "Controlista", icon: ClipboardCheck, permission: "controls:write" },
  { to: "/reports", label: "Reportes", icon: FileText, permission: "reports:view" },
  { to: "/admin", label: "Administracion", icon: Database, permission: "admin:operational" },
  { to: "/audit", label: "Auditoria", icon: History, permission: "audit:view" },
  { to: "/docs/manual", label: "Manual", icon: BookOpen, permission: "dashboard:view" },
  { to: "/docs/formulas", label: "Formulas", icon: Activity, permission: "dashboard:view" },
  { to: "/docs/dictionary", label: "Diccionario", icon: Database, permission: "dashboard:view" },
  { to: "/docs/assumptions", label: "Supuestos", icon: Settings, permission: "dashboard:view" },
];

export function AppLayout() {
  const { profile, signOut } = useAuth();
  const [light, setLight] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("light", light);
  }, [light]);

  return (
    <div className="min-h-screen bg-[color:var(--brand-bg)]">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-72 flex-col border-r border-[color:var(--brand-border)] bg-[color:var(--brand-surface)] p-4 lg:flex">
        <div className="mb-8 flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-lg bg-emerald-500 text-slate-950">
            <Shield size={22} />
          </span>
          <div>
            <p className="font-bold leading-tight">Productividad Pickeo</p>
            <p className="text-xs text-[color:var(--brand-muted)]">Operacion logistica</p>
          </div>
        </div>
        <nav className="grid gap-1">
          {links
            .filter((link) => can(profile, link.permission))
            .map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? "bg-emerald-500 text-slate-950"
                      : "text-slate-300 hover:bg-slate-800 light:text-slate-700 light:hover:bg-slate-100"
                  }`
                }
              >
                <Icon size={18} />
                {label}
              </NavLink>
            ))}
        </nav>
        <SupabaseUsageMiniCard />
      </aside>
      <div className="lg:pl-72">
        <header className="sticky top-0 z-10 border-b border-[color:var(--brand-border)] bg-[color:var(--brand-bg)]/95 px-4 py-3 backdrop-blur md:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-[color:var(--brand-muted)]">
                Ultima actualizacion: 04/06/2026
              </p>
              <h1 className="text-xl font-bold">App de Productividad y Eficacia de Pickeo</h1>
              <p className="mt-1 text-sm text-[color:var(--brand-muted)]">
                Monitorea tiempos, productividad, eficacia y pendientes de control de la operacion.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={() => setLight((value) => !value)} aria-label="Cambiar tema">
                {light ? <Moon size={18} /> : <Sun size={18} />}
              </Button>
              <div className="hidden text-right text-sm sm:block">
                <p className="font-semibold">{profile?.full_name ?? profile?.email}</p>
                <p className="text-[color:var(--brand-muted)]">{profile?.role}</p>
              </div>
              <Button variant="secondary" onClick={signOut}>
                <LogOut size={18} />
                Salir
              </Button>
            </div>
          </div>
          <nav className="mt-3 flex gap-2 overflow-x-auto lg:hidden">
            {links
              .filter((link) => can(profile, link.permission))
              .map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `whitespace-nowrap rounded-md px-3 py-2 text-sm ${
                      isActive ? "bg-emerald-500 text-slate-950" : "bg-[color:var(--brand-surface)]"
                    }`
                  }
                >
                  {label}
                </NavLink>
              ))}
          </nav>
        </header>
        <main className="p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
