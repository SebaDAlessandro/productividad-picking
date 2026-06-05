import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Lock, Mail, Shield } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Field, Input, Select } from "../../components/ui/Field";
import { isSupabaseConfigured } from "../../lib/supabase/client";
import { useAuth } from "../../hooks/useAuth";
import type { RoleName } from "../../types/domain";

export function LoginPage() {
  const { profile, signIn, demoLogin } = useAuth();
  const [email, setEmail] = useState("sebadalessandro@gmail.com");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<RoleName>("superadmin");
  const [error, setError] = useState("");

  if (profile) return <Navigate to="/" replace />;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    const result = await signIn(email, password);
    if (result.error) setError(result.error);
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[color:var(--brand-bg)] p-4">
      <Card className="w-full max-w-md">
        <div className="mb-6 flex items-center gap-3">
          <span className="grid size-12 place-items-center rounded-lg bg-emerald-500 text-slate-950">
            <Shield size={24} />
          </span>
          <div>
            <h1 className="text-xl font-bold">Ingreso seguro</h1>
            <p className="text-sm text-[color:var(--brand-muted)]">
              Supabase Auth con rutas privadas y RLS.
            </p>
          </div>
        </div>
        <form className="grid gap-4" onSubmit={submit}>
          <Field label="Email">
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 text-[color:var(--brand-muted)]" size={18} />
              <Input className="w-full pl-10" value={email} onChange={(event) => setEmail(event.target.value)} />
            </div>
          </Field>
          <Field label="Contrasena">
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 text-[color:var(--brand-muted)]" size={18} />
              <Input
                className="w-full pl-10"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
          </Field>
          {error ? <p className="rounded-md bg-red-500/10 p-3 text-sm text-red-300">{error}</p> : null}
          <Button type="submit">Ingresar</Button>
        </form>
        {!isSupabaseConfigured ? (
          <div className="mt-5 grid gap-3 border-t border-[color:var(--brand-border)] pt-5">
            <Field label="Modo demo local">
              <Select value={role} onChange={(event) => setRole(event.target.value as RoleName)}>
                <option value="superadmin">Superadministrador</option>
                <option value="admin">Administrador</option>
                <option value="supervisor">Supervisor</option>
                <option value="controlista">Controlista</option>
                <option value="operario">Operario</option>
                <option value="solo_lectura">Solo lectura</option>
              </Select>
            </Field>
            <Button variant="secondary" onClick={() => demoLogin(role)}>
              Entrar en demo
            </Button>
          </div>
        ) : null}
        <Link className="mt-4 block text-sm text-emerald-300" to="/reset-password">
          Recuperar contrasena
        </Link>
      </Card>
    </main>
  );
}
