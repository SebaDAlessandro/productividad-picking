import { Link } from "react-router-dom";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";

export function AccessDeniedPage() {
  return (
    <Card>
      <h2 className="text-xl font-bold">Acceso denegado</h2>
      <p className="mt-2 text-[color:var(--brand-muted)]">
        Tu rol no tiene permisos para acceder a este modulo. La validacion final vive en RLS.
      </p>
      <Link to="/" className="mt-4 inline-block">
        <Button variant="secondary">Volver</Button>
      </Link>
    </Card>
  );
}

export function NotFoundPage() {
  return (
    <Card>
      <h2 className="text-xl font-bold">Pagina 404</h2>
      <p className="mt-2 text-[color:var(--brand-muted)]">No encontramos la pantalla solicitada.</p>
      <Link to="/" className="mt-4 inline-block">
        <Button variant="secondary">Ir al dashboard</Button>
      </Link>
    </Card>
  );
}
