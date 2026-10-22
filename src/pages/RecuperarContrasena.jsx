import {useState} from "react";
import { Link } from "react-router";
import { supabase } from "../lib/supabaseClient";
import Boton from "../components/ui/Boton";
import Campo from "../components/ui/Campo";
import TarjetaAcceso from "../components/ui/TarjetaAcceso";
import { claseControl } from "../components/ui/clases";
export default function RecuperarContrasena() {
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setExito(false);
    setEnviando(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/nueva-contrasena`,
    });

    setEnviando(false);

    if (error) {
      setError(error.message);
    } else {
      setExito(true);
    }
  }

  return (
    <TarjetaAcceso titulo="Recuperar contraseña" subtitulo="Ingresa tu correo para recibir instrucciones de recuperación.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Campo id="email" etiqueta="Correo">
          <input
            id="email" type="email" required autoComplete="email"
            value={email} onChange={(e) => setEmail(e.target.value)}
            className={claseControl}
          />
        </Campo>

        {error && <p role="alert" className="rounded-lg bg-red-50 p-2 text-sm text-red-700">{error}</p>}
        {exito && (
          <p role="alert" className="rounded-lg bg-green-50 p-2 text-sm text-green-700">
            Se ha enviado un correo con instrucciones para recuperar tu contraseña.
          </p>
        )}

        <Boton type="submit" cargando={enviando}>
          {enviando ? "Enviando..." : "Enviar instrucciones"}
        </Boton>

        <p className="text-center text-sm text-slate-600">
          <Link to="/login" className="font-medium text-marca-700 hover:underline">Volver a iniciar sesión</Link>
        </p>
      </form>
    </TarjetaAcceso>
  );
}
