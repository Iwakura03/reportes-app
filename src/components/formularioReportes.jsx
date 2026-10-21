import { useEffect, useState } from "react";
import { ImagePlus, Send, X } from "lucide-react";
import imageCompression from "browser-image-compression";
import { supabase } from "../lib/supabaseClient";
import { COLUMNAS_REPORTE } from "../lib/reportes";
import Boton from "./ui/Boton";
import Campo from "./ui/Campo";
import { claseControl } from "./ui/clases";

// Hoja inferior (en móvil) o tarjeta flotante (en escritorio) para crear un reporte.
// Se oculta con CSS en vez de desmontarse para no perder lo que ya se escribió.
export default function FormularioReporte({
  position,
  categorias,
  cargandoCategorias,
  errorCategorias,
  abierto,
  onCerrar,
  onReporteCreado,
}) {
  const [categoriaId, setCategoriaId] = useState("");
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  // { tipo: "error" | "exito", mensaje } o null
  const [alerta, setAlerta] = useState(null);
  // false, "foto" (subiendo la imagen) o "datos" (guardando el reporte)
  const [enviando, setEnviando] = useState(false);
  // { archivo, preview } o null
  const [foto, setFoto] = useState(null);

  // Mientras no se elija otra, se usa la primera categoría
  const categoriaElegida =
    categoriaId || (categorias.length > 0 ? String(categorias[0].id) : "");

  // Libera la URL de la vista previa al cambiar de foto o al desmontar
  useEffect(() => {
    if (!foto) return;
    return () => URL.revokeObjectURL(foto.preview);
  }, [foto]);

  function handleFoto(event) {
    const archivo = event.target.files[0];
    // Permite volver a elegir el mismo archivo después de quitarlo
    event.target.value = "";
    if (!archivo) return;

    if (!archivo.type.startsWith("image/")) {
      setAlerta({ tipo: "error", mensaje: "El archivo debe ser una imagen." });
      return;
    }

    if (archivo.size > 15 * 1024 * 1024) {
      setAlerta({
        tipo: "error",
        mensaje: "La imagen es demasiado grande (máximo 15 MB).",
      });
      return;
    }

    setAlerta(null);
    setFoto({ archivo, preview: URL.createObjectURL(archivo) });
  }

  async function subirFoto() {
    // Recomprimir también elimina los metadatos EXIF (incluido el GPS)
    const comprimida = await imageCompression(foto.archivo, {
      maxSizeMB: 1,
      maxWidthOrHeight: 1600,
      fileType: "image/webp",
      useWebWorker: true,
    });

    // La política del bucket solo permite subir dentro de "reportes/"
    const ruta = `reportes/${crypto.randomUUID()}.webp`;
    const { error } = await supabase.storage
      .from("fotos-reportes")
      .upload(ruta, comprimida, { contentType: "image/webp" });

    if (error) throw error;
    return ruta;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const tituloLimpio = titulo.trim();

    if (!categoriaElegida) {
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

    setAlerta(null);

    let fotoPath = null;
    if (foto) {
      setEnviando("foto");
      try {
        fotoPath = await subirFoto();
      } catch (err) {
        console.error(err);
        setEnviando(false);
        setAlerta({
          tipo: "error",
          mensaje: "No se pudo subir la foto. Intenta de nuevo.",
        });
        return;
      }
    }

    setEnviando("datos");

    // estado, usuario_id y fechas los llena el trigger de la base de datos.
    // Si este insert falla, la foto ya subida queda huérfana: los usuarios
    // anónimos no pueden borrar del bucket (solo los admins).
    // .select() devuelve la fila guardada para dibujar su marcador sin recargar
    const { data, error } = await supabase
      .from("reportes")
      .insert({
        titulo: tituloLimpio,
        descripcion: descripcion.trim(),
        categoria_id: Number(categoriaElegida),
        // PostGIS espera primero la longitud y luego la latitud
        ubicacion: `SRID=4326;POINT(${position[1]} ${position[0]})`,
        foto_path: fotoPath,
      })
      .select(COLUMNAS_REPORTE)
      .single();

    setEnviando(false);

    if (error) {
      console.error(error);
      setAlerta({
        tipo: "error",
        mensaje: "No se pudo enviar el reporte. Intenta de nuevo.",
      });
      return;
    }

    // El mapa cierra el formulario y avisa que se envió
    onReporteCreado?.(data);
    setTitulo("");
    setDescripcion("");
    setFoto(null);
  }

  const aviso = alerta ?? (errorCategorias
    ? { tipo: "error", mensaje: "No se pudieron cargar las categorías." }
    : null);

  return (
    <div
      className={`absolute inset-x-0 bottom-0 z-[1000] sm:bottom-4 sm:left-4 sm:right-auto sm:w-96 ${
        abierto ? "" : "hidden"
      }`}
    >
      <div className="max-h-[65svh] overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:max-h-[calc(100svh-8rem)] sm:rounded-2xl">
        <div className="sticky top-0 flex items-start justify-between gap-2 bg-white px-4 pt-4 pb-2">
          <div>
            <h2 className="text-lg font-semibold">Nuevo reporte</h2>
            <p className="text-xs text-slate-600">
              Toca el mapa o arrastra el marcador azul para marcar el lugar exacto.
            </p>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar formulario"
            className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 px-4 pb-4">
          <Campo id="categoria" etiqueta="Categoría del problema">
            <select
              id="categoria"
              value={categoriaElegida}
              onChange={(e) => setCategoriaId(e.target.value)}
              disabled={cargandoCategorias}
              className={claseControl}
            >
              {cargandoCategorias && <option value="">Cargando...</option>}
              {categorias.map((categoria) => (
                <option key={categoria.id} value={categoria.id}>
                  {categoria.nombre}
                </option>
              ))}
            </select>
          </Campo>

          <Campo id="titulo" etiqueta="Título" contador={`${titulo.length}/120`}>
            <input
              id="titulo"
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              maxLength={120}
              placeholder="Ej: Bache grande en la calle Hidalgo"
              className={claseControl}
            />
          </Campo>

          <Campo
            id="descripcion"
            etiqueta="Descripción"
            contador={`${descripcion.length}/2000`}
          >
            <textarea
              id="descripcion"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={3}
              maxLength={2000}
              placeholder="Ej: Enfrente de la escuela X, hay muchos baches..."
              className={claseControl}
            />
          </Campo>

          {foto ? (
            <div className="flex items-center gap-3">
              <img
                src={foto.preview}
                alt="Vista previa de la foto"
                className="h-16 w-16 rounded-lg object-cover"
              />
              <button
                type="button"
                onClick={() => setFoto(null)}
                disabled={Boolean(enviando)}
                className="flex items-center gap-1 text-sm text-slate-600 hover:text-red-600 disabled:opacity-60"
              >
                <X className="h-4 w-4" />
                Quitar foto
              </button>
            </div>
          ) : (
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 p-3 text-sm text-slate-600 hover:bg-slate-50 focus-within:ring-2 focus-within:ring-marca-500">
              <ImagePlus className="h-4 w-4" />
              <span>Agregar foto (opcional)</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFoto}
                disabled={Boolean(enviando)}
                className="sr-only"
              />
            </label>
          )}

          {aviso && (
            <div
              role="alert"
              className={`rounded-lg p-2 text-sm ${
                aviso.tipo === "error"
                  ? "bg-red-50 text-red-700"
                  : "bg-green-50 text-green-700"
              }`}
            >
              {aviso.mensaje}
            </div>
          )}

          <Boton
            type="submit"
            icono={Send}
            cargando={Boolean(enviando)}
            disabled={cargandoCategorias}
          >
            {enviando === "foto"
              ? "Subiendo foto..."
              : enviando
                ? "Enviando..."
                : "Enviar reporte"}
          </Boton>
        </form>
      </div>
    </div>
  );
}
