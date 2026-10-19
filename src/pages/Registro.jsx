import { useState } from "react";
import { Link, Navigate } from "react-router";

import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/useAuth";

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
      <div className="mx-auto max-w-sm rounded-lg bg-green-50 p-4 text-green-700">
        Te enviamos un correo a <b>{email}</b>. Abre el enlace para activar tu cuenta.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-sm space-y-3">
      <h2 className="text-xl font-bold">Crear cuenta</h2>

      <input
        type="text" required maxLength={80} placeholder="Nombre"
        value={nombre} onChange={(e) => setNombre(e.target.value)}
        className="w-full rounded-lg border border-gray-300 p-2"
      />
      <input
        type="email" required placeholder="Correo" autoComplete="email"
        value={email} onChange={(e) => setEmail(e.target.value)}
        className="w-full rounded-lg border border-gray-300 p-2"
      />
      <input
        type="password" required placeholder="Contraseña" autoComplete="new-password"
        value={password} onChange={(e) => setPassword(e.target.value)}
        className="w-full rounded-lg border border-gray-300 p-2"
      />

      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}

      <button
        type="submit" disabled={enviando}
        className="w-full rounded-lg bg-blue-600 p-2.5 font-medium text-white disabled:opacity-60"
      >
        {enviando ? "Creando cuenta..." : "Registrarme"}
      </button>

      <p className="text-sm">
        ¿Ya tienes cuenta? <Link to="/login" className="text-blue-600">Inicia sesión</Link>
      </p>
    </form>
  );
}
