import { useState } from "react";
import { Link, Navigate } from "react-router";

import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/useAuth";
import Boton from "../components/ui/Boton";
import Campo from "../components/ui/Campo";
import TarjetaAcceso from "../components/ui/TarjetaAcceso";
import { claseControl } from "../components/ui/clases";

export default function Login() {
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  if (user) return <Navigate to="/" replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setEnviando(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setEnviando(false);

    if (error) {
      setError(
        error.message === "Email not confirmed"
          ? "Primero confirma tu correo con el enlace que te enviamos."
          : "Correo o contraseña incorrectos."
      );
    }
    // Si salió bien, AuthProvider recibe SIGNED_IN y <Navigate> redirige
  }

  return (
    <TarjetaAcceso titulo="Iniciar sesión" subtitulo="Entra para dar seguimiento a tus reportes.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Campo id="email" etiqueta="Correo">
          <input
            id="email" type="email" required autoComplete="email"
            value={email} onChange={(e) => setEmail(e.target.value)}
            className={claseControl}
          />
        </Campo>
        <Campo id="password" etiqueta="Contraseña">
          <input
            id="password" type="password" required autoComplete="current-password"
            value={password} onChange={(e) => setPassword(e.target.value)}
            className={claseControl}
          />
        </Campo>

        {error && <p role="alert" className="rounded-lg bg-red-50 p-2 text-sm text-red-700">{error}</p>}

        <Boton type="submit" cargando={enviando}>
          {enviando ? "Entrando..." : "Entrar"}
        </Boton>

        <p className="text-center text-sm text-slate-600">
          ¿No tienes cuenta? <Link to="/registro" className="font-medium text-marca-700 hover:underline">Regístrate</Link>
        </p>
      </form>
    </TarjetaAcceso>
  );
}
