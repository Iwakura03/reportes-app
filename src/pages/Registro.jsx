import { useState } from "react";
import { Link, Navigate } from "react-router";

import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/useAuth";
import Boton from "../components/ui/Boton";
import Campo from "../components/ui/Campo";
import TarjetaAcceso from "../components/ui/TarjetaAcceso";
import { claseControl } from "../components/ui/clases";

export default function Registro() {
  const { user } = useAuth();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);
  const [revisaCorreo, setRevisaCorreo] = useState(false);

  // Si ya hay sesión, no tiene sentido registrarse
  if (user) return <Navigate to="/" replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setEnviando(true);

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { nombre: nombre.trim() },
        emailRedirectTo: window.location.origin,
      },
    });

    setEnviando(false);

    if (error) {
      setError(
        error.message === "User already registered"
          ? "Ya existe una cuenta con ese correo."
          : "No se pudo crear la cuenta. Intenta de nuevo."
      );
      return;
    }

    // Con "Confirm email" activado no hay sesión todavía
    if (!data.session) setRevisaCorreo(true);
    // Si sí hay sesión, AuthProvider se entera y el <Navigate> de arriba redirige
  }

  if (revisaCorreo) {
    return (
      <TarjetaAcceso titulo="Revisa tu correo">
        <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
          Te enviamos un correo a <b>{email}</b>. Abre el enlace para activar tu cuenta.
        </p>
      </TarjetaAcceso>
    );
  }

  return (
    <TarjetaAcceso titulo="Crear cuenta" subtitulo="Regístrate para dar seguimiento a tus reportes.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Campo id="nombre" etiqueta="Nombre">
          <input
            id="nombre" type="text" required maxLength={80} autoComplete="name"
            value={nombre} onChange={(e) => setNombre(e.target.value)}
            className={claseControl}
          />
        </Campo>
        <Campo id="email" etiqueta="Correo">
          <input
            id="email" type="email" required autoComplete="email"
            value={email} onChange={(e) => setEmail(e.target.value)}
            className={claseControl}
          />
        </Campo>
        <Campo id="password" etiqueta="Contraseña">
          <input
            id="password" type="password" required autoComplete="new-password"
            aria-describedby="password-ayuda"
            value={password} onChange={(e) => setPassword(e.target.value)}
            className={claseControl}
          />
          <p id="password-ayuda" className="text-xs text-slate-500">Mínimo 6 caracteres.</p>
        </Campo>

        {error && <p role="alert" className="rounded-lg bg-red-50 p-2 text-sm text-red-700">{error}</p>}

        <Boton type="submit" cargando={enviando}>
          {enviando ? "Creando cuenta..." : "Registrarme"}
        </Boton>

        <p className="text-center text-sm text-slate-600">
          ¿Ya tienes cuenta? <Link to="/login" className="font-medium text-marca-700 hover:underline">Inicia sesión</Link>
        </p>
      </form>
    </TarjetaAcceso>
  );
}
