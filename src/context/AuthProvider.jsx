import { useEffect, useState } from "react";

import { supabase } from "../lib/supabaseClient";
import { AuthContext } from "./authContext";

export default function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);

  const user = session?.user ?? null;

  // 1) Escuchar la sesión
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_evento, nuevaSesion) => {
      setSession(nuevaSesion);
      setCargando(false);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  // 2) Cargar el perfil (nombre y rol) cuando cambia el usuario
  useEffect(() => {
    if (!user) return;

    let cancelado = false;

    supabase
      .from("perfiles")
      .select("id, nombre, rol")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (!cancelado) setPerfil(data);
      });

    return () => {
      cancelado = true;
    };
  }, [user?.id]);

  // Solo usamos el perfil si corresponde al usuario actual
  const perfilActual = user && perfil?.id === user.id ? perfil : null;

  const valor = {
    session,
    user,
    perfil: perfilActual,
    esAdmin: perfilActual?.rol === "admin",
    cargando,
    cerrarSesion: () => supabase.auth.signOut(),
  };

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

