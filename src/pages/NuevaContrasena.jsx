import { useState } from "react";
import { useNavigate } from "react-router";

import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/useAuth";
import Boton from "../components/ui/Boton";
import Campo from "../components/ui/Campo";
import TarjetaAcceso from "../components/ui/TarjetaAcceso";
import { claseControl } from "../components/ui/clases";

export default function NuevaContrasena() {
  const { user, cargando } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  if (cargando) return null;

  if (!user) {
    return (
      <TarjetaAcceso titulo="Enlace no válido" subtitulo="El enlace expiró o ya se usó. Pide uno nuevo desde «¿Olvidaste tu contraseña?»." />
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setEnviando(true);
    const { error } = await supabase.auth.updateUser({ password });
    setEnviando(false);

    if (error) setError("No pudimos cambiar la contraseña. Intenta de nuevo.");
    else navigate("/", { replace: true });
  }

  return (
    <TarjetaAcceso titulo="Nueva contraseña" subtitulo="Escribe la contraseña que quieres usar a partir de ahora.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Campo id="password" etiqueta="Nueva contraseña">
          <input
            id="password" type="password" required autoComplete="new-password"
            value={password} onChange={(e) => setPassword(e.target.value)}
            className={claseControl}
          />
        </Campo>

        {error && <p role="alert" className="rounded-lg bg-red-50 p-2 text-sm text-red-700">{error}</p>}

        <Boton type="submit" cargando={enviando}>
          {enviando ? "Guardando..." : "Guardar contraseña"}
        </Boton>
      </form>
    </TarjetaAcceso>
  );
}
