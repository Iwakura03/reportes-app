import { Link } from "react-router";

import { useAuth } from "../context/useAuth";

export default function Encabezado() {
  const { user, perfil, cargando, cerrarSesion } = useAuth();

  return (
    <header className="flex items-center justify-between border-b px-6 py-3">
      <Link to="/" className="text-lg font-bold">Reportes ciudadanos</Link>

      {cargando ? null : user ? (
        <div className="flex items-center gap-3 text-sm">
          <span>Hola, {perfil?.nombre || user.email}</span>
          <button onClick={cerrarSesion} className="text-blue-600">Cerrar sesión</button>
        </div>
      ) : (
        <div className="flex gap-3 text-sm">
          <Link to="/login" className="text-blue-600">Iniciar sesión</Link>
          <Link to="/registro" className="text-blue-600">Registrarme</Link>
        </div>
      )}
    </header>
  );
}
