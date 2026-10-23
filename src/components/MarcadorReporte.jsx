//importaciones
import { useEffect, useMemo, useRef } from "react";
import { Marker, Popup } from "react-leaflet";
import { Link } from "react-router";
import L from "leaflet";
import { infoEstado, urlFoto } from "../lib/reportes";

// Círculo del color de la categoría, para distinguirlo del marcador azul de ubicacion.
function crearIcono(color) {
  return L.divIcon({
    className: "",
    html: `<span style="display:block;width:20px;height:20px;border-radius:9999px;background:${color};border:3px solid white;box-shadow:0 1px 4px rgba(0,0,0,.4)"></span>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10],
  });
}

// abrir: abre el popup al montarse (se usa con el reporte recién creado)
export default function MarcadorReporte({ reporte, abrir = false }) {
  const color = reporte.categoria?.color ?? "#475569";
  const icono = useMemo(() => crearIcono(color), [color]);
  const foto = urlFoto(reporte.foto_path);
  const estado = infoEstado(reporte.estado);
  const markerRef = useRef(null);

  useEffect(() => {
    if (abrir) markerRef.current?.openPopup();
  }, [abrir]);

//se dibuja el mapa
  return (
    <Marker position={[reporte.lat, reporte.lng]} icon={icono} ref={markerRef}>
      <Popup>
        <div className="w-56 space-y-1">
          <p className="!m-0 text-xs font-medium" style={{ color }}>
            {reporte.categoria?.nombre}
          </p>
          <p className="!m-0 font-semibold">{reporte.titulo}</p>
          {reporte.descripcion && (
            <p className="!m-0 text-sm text-slate-700">{reporte.descripcion}</p>
          )}
          {foto && (
            <img
              src={foto}
              alt={reporte.titulo}
              loading="lazy"
              className="mt-1 h-32 w-full rounded object-cover"
            />
          )}
          <div className="flex items-center gap-2 pt-1 text-xs text-slate-500">
            <span className={`rounded-full px-2 py-0.5 font-medium ${estado.clases}`}>
              {estado.texto}
            </span>
            {new Date(reporte.created_at).toLocaleDateString("es-MX")}
          </div>
          <Link
            to={`/reporte/${reporte.id}`}
            className="block pt-1 text-sm font-medium !text-marca-600 hover:underline"
          >
            Ver detalle y seguimiento
          </Link>
        </div>
      </Popup>
    </Marker>
  );
}
