import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Field, Input } from "../../components/ui/Field";
import { useAuth } from "../../hooks/useAuth";

export function ResetPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const result = await resetPassword(email);
    setMessage(result.error ?? "Si el email existe, recibira instrucciones de recuperacion.");
  }

  return (
    <main className="grid min-h-screen place-items-center p-4">
      <Card className="w-full max-w-md">
        <h1 className="text-xl font-bold">Recuperar contrasena</h1>
        <p className="mt-2 text-sm text-[color:var(--brand-muted)]">
          Envia instrucciones de recuperacion al email registrado en Supabase Auth.
        </p>
        <form className="mt-5 grid gap-4" onSubmit={submit}>
          <Field label="Email">
            <Input value={email} onChange={(event) => setEmail(event.target.value)} />
          </Field>
          <Button>Enviar instrucciones</Button>
        </form>
        {message ? <p className="mt-4 text-sm text-[color:var(--brand-muted)]">{message}</p> : null}
        <Link className="mt-4 block text-sm text-emerald-300" to="/login">
          Volver al login
        </Link>
      </Card>
    </main>
  );
}
