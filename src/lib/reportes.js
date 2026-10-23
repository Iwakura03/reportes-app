import { supabase } from "./supabaseClient";

// Columnas que necesita el mapa. lat y lng son columnas calculadas en la base
// de datos, así no hay que decodificar el punto de PostGIS en el cliente.
export const COLUMNAS_REPORTE =
  "id, titulo, descripcion, estado, lat, lng, foto_path, created_at, categoria_id, categoria:categorias (nombre, color)";

// Categorías activas, las usan el filtro del mapa y el formulario
export function cargarCategorias() {
  return supabase
    .from("categorias")
    .select("id, nombre, color")
    .eq("activa", true)
    .order("orden");
}
// Un reporte con su historial, de la más antigua a la más reciente
export function cargarReporte(id) {
  return supabase
    .from("reportes")
    .select(`${COLUMNAS_REPORTE}, direccion, actualizaciones (id, estado, comentario, created_at)`)
    .eq("id", id)
    .order("created_at", { referencedTable: "actualizaciones" })
    .maybeSingle();
}

//diccionario de estados, con el color de su etiqueta.
const ESTADOS = {
  pendiente: { texto: "Pendiente", clases: "bg-amber-100 text-amber-800" },
  en_revision: { texto: "En revisión", clases: "bg-sky-100 text-sky-800" },
  en_proceso: { texto: "En proceso", clases: "bg-indigo-100 text-indigo-800" },
  resuelto: { texto: "Resuelto", clases: "bg-green-100 text-green-800" },
  rechazado: { texto: "Rechazado", clases: "bg-slate-200 text-slate-700" },
};

// Texto y clases de la etiqueta de un estado; lo usan el popup y el detalle
export function infoEstado(estado) {
  return ESTADOS[estado] ?? { texto: estado, clases: "bg-slate-100 text-slate-700" };
}

export function urlFoto(fotoPath) {
  if (!fotoPath) return null;
  return supabase.storage.from("fotos-reportes").getPublicUrl(fotoPath).data
    .publicUrl;
}
