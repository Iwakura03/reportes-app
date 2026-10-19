import { useState } from "react";
import { Link, Navigate } from "react-router";

import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/useAuth";

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
    <form onSubmit={handleSubmit} className="mx-auto max-w-sm space-y-3">
      <h2 className="text-xl font-bold">Iniciar sesión</h2>

      <input
        type="email" required placeholder="Correo" autoComplete="email"
        value={email} onChange={(e) => setEmail(e.target.value)}
        className="w-full rounded-lg border border-gray-300 p-2"
      />
      <input
        type="password" required placeholder="Contraseña" autoComplete="current-password"
        value={password} onChange={(e) => setPassword(e.target.value)}
        className="w-full rounded-lg border border-gray-300 p-2"
      />

      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}

      <button
        type="submit" disabled={enviando}
        className="w-full rounded-lg bg-blue-600 p-2.5 font-medium text-white disabled:opacity-60"
      >
        {enviando ? "Entrando..." : "Entrar"}
      </button>

      <p className="text-sm">
        ¿No tienes cuenta? <Link to="/registro" className="text-blue-600">Regístrate</Link>
      </p>
    </form>
  );
}

