import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Send } from "lucide-react";

import { supabase } from "../lib/supabaseClient";

export default function FormularioReporte({ position }) {
  const [abierto, setAbierto] = useState(true);
  const [categorias, setCategorias] = useState([]);
  const [cargandoCategorias, setCargandoCategorias] = useState(true);
  const [categoriaId, setCategoriaId] = useState("");
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  // { tipo: "error" | "exito", mensaje } o null
  const [alerta, setAlerta] = useState(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    let cancelado = false;

    supabase
      .from("categorias")
      .select("id, nombre")
      .eq("activa", true)
      .order("orden")
      .then(({ data, error }) => {
        if (cancelado) return;

        if (error) {
          setAlerta({
            tipo: "error",
            mensaje: "No se pudieron cargar las categorías.",
          });
        } else {
          setCategorias(data);
          if (data.length > 0) setCategoriaId(String(data[0].id));
        }
        setCargandoCategorias(false);
      });

    return () => {
      cancelado = true;
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();

    const tituloLimpio = titulo.trim();

    if (!categoriaId) {
      setAlerta({ tipo: "error", mensaje: "Selecciona una categoría." });
      return;
    }

    if (tituloLimpio.length < 5 || tituloLimpio.length > 120) {
      setAlerta({
        tipo: "error",
        mensaje: "El título debe tener entre 5 y 120 caracteres.",
      });
      return;
    }

    if (!descripcion.trim()) {
      setAlerta({ tipo: "error", mensaje: "Escribe una descripción." });
      return;
    }

    setEnviando(true);
    setAlerta(null);

    // estado, usuario_id y fechas los llena el trigger de la base de datos
    const { error } = await supabase.from("reportes").insert({
      titulo: tituloLimpio,
      descripcion: descripcion.trim(),
      categoria_id: Number(categoriaId),
      // PostGIS espera primero la longitud y luego la latitud
      ubicacion: `SRID=4326;POINT(${position[1]} ${position[0]})`,
    });

    setEnviando(false);

    if (error) {
      console.error(error);
      setAlerta({
        tipo: "error",
        mensaje: "No se pudo enviar el reporte. Intenta de nuevo.",
      });
      return;
    }

    setAlerta({ tipo: "exito", mensaje: "¡Reporte enviado! Gracias." });
    setTitulo("");
    setDescripcion("");
  }

  return (
    <div className="absolute inset-x-0 bottom-0 z-[1000] mx-auto w-full sm:bottom-3 sm:max-w-md">
      <div className="rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
        {/* Pestaña para abrir/cerrar */}
        <button
          type="button"
          onClick={() => setAbierto((valor) => !valor)}
          aria-label="Abrir u ocultar formulario"
          aria-expanded={abierto}
          className="flex w-full flex-col items-center gap-1 pt-2 pb-1 text-xs text-gray-500 hover:text-gray-700"
        >
          <span className="h-1.5 w-10 rounded-full bg-gray-300" />
          <span className="flex items-center gap-1">
            {abierto ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronUp className="h-3 w-3" />
            )}
            {abierto ? "Ocultar" : "Mostrar"}
          </span>
        </button>

        {abierto && (
          <div className="space-y-3 px-4 pb-4">
            <div>
              <h3 className="text-lg font-semibold">Crear Nuevo Reporte</h3>
              <span className="text-xs text-gray-500">
                Arrastra el marcador azul para ajustar la ubicación exacta
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1">
                <label htmlFor="categoria" className="text-sm font-medium">
                  Categoría del problema
                </label>
                <select
                  id="categoria"
                  value={categoriaId}
                  onChange={(e) => setCategoriaId(e.target.value)}
                  disabled={cargandoCategorias}
                  className="w-full rounded-lg border border-gray-300 bg-white p-2 text-sm"
                >
                  {cargandoCategorias && <option value="">Cargando...</option>}
                  {categorias.map((categoria) => (
                    <option key={categoria.id} value={categoria.id}>
                      {categoria.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label htmlFor="titulo" className="text-sm font-medium">
                  Título
                </label>
                <input
                  id="titulo"
                  type="text"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  maxLength={120}
                  placeholder="Ej: Bache grande en la calle Hidalgo"
                  className="w-full rounded-lg border border-gray-300 p-2 text-sm"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="descripcion" className="text-sm font-medium">
                  Descripción
                </label>
                <textarea
                  id="descripcion"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  rows={2}
                  maxLength={2000}
                  placeholder="Ej: Enfrente de la escuela X, hay muchos baches..."
                  className="w-full rounded-lg border border-gray-300 p-2 text-sm"
                />
              </div>

              <p className="text-xs text-gray-500">
                Ubicación: {position[0].toFixed(6)}, {position[1].toFixed(6)}
              </p>

              {alerta && (
                <div
                  role="alert"
                  className={`rounded-lg p-2 text-sm ${
                    alerta.tipo === "error"
                      ? "bg-red-50 text-red-700"
                      : "bg-green-50 text-green-700"
                  }`}
                >
                  {alerta.mensaje}
                </div>
              )}

              <button
                type="submit"
                disabled={enviando || cargandoCategorias}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 p-2.5 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Send className="h-4 w-4" />
                <span>{enviando ? "Enviando..." : "Enviar Reporte"}</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
