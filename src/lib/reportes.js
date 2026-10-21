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

export function urlFoto(fotoPath) {
  if (!fotoPath) return null;
  return supabase.storage.from("fotos-reportes").getPublicUrl(fotoPath).data
    .publicUrl;
}
