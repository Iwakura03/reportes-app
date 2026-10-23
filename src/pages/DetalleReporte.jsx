import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft, LoaderCircle, MapPin } from "lucide-react";

import { cargarReporte, infoEstado, urlFoto } from "../lib/reportes";

function Etiqueta({ estado }) {
  const { texto, clases } = infoEstado(estado);
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${clases}`}>
      {texto}
    </span>
  );
}

function formatearFecha(fecha) {
  return new Date(fecha).toLocaleString("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

// Mensaje centrado para los estados de carga, error y no encontrado
function Mensaje({ children }) {
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-16 text-center text-sm text-slate-600">
      {children}
      <Link to="/" className="font-medium text-marca-600 hover:underline">
        Volver al mapa
      </Link>
    </div>
  );
}

export default function DetalleReporte() {
  const { id } = useParams();
  // undefined = cargando, null = no existe
  const [reporte, setReporte] = useState(undefined);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelado = false;
    cargarReporte(id).then(({ data, error }) => {
      if (cancelado) return;
      if (error?.code === "22P02") return setReporte(null); // id que no es uuid
      if (error) {
        console.error(error);
        setError(true);
        return;
      }
      setReporte(data);
    });
    return () => {
      cancelado = true;
    };
  }, [id]);

  if (error) return <Mensaje>No se pudo cargar el reporte.</Mensaje>;
  if (reporte === undefined) {
    return (
      <div className="flex justify-center py-16">
        <LoaderCircle className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }
  if (reporte === null) return <Mensaje>Reporte no encontrado.</Mensaje>;

  // El primer paso no existe en la base de datos: es la creación del reporte
  const historial = [
    { id: "creado", estado: "pendiente", comentario: "Reporte recibido", created_at: reporte.created_at },
    ...reporte.actualizaciones,
  ];
  const foto = urlFoto(reporte.foto_path);
  const color = reporte.categoria?.color ?? "#475569";

  return (
    <div className="px-4 py-6">
      <div className="mx-auto max-w-xl">
        <Link
          to="/"
          className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al mapa
        </Link>

        <article className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <header className="space-y-1">
            <p className="text-sm font-medium" style={{ color }}>
              {reporte.categoria?.nombre}
            </p>
            <h1 className="text-xl font-bold">{reporte.titulo}</h1>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Etiqueta estado={reporte.estado} />
              {formatearFecha(reporte.created_at)}
            </div>
          </header>

          {foto && (
            <img
              src={foto}
              alt={reporte.titulo}
              className="max-h-80 w-full rounded-lg object-cover"
            />
          )}

          {reporte.descripcion && (
            <p className="whitespace-pre-line text-sm text-slate-700">
              {reporte.descripcion}
            </p>
          )}

          {reporte.direccion && (
            <p className="flex items-center gap-1 text-sm text-slate-600">
              <MapPin className="h-4 w-4 shrink-0" />
              {reporte.direccion}
            </p>
          )}

          <section className="border-t border-slate-200 pt-4">
            <h2 className="mb-3 text-sm font-semibold">Seguimiento</h2>
            <ol className="space-y-4 border-l-2 border-slate-200 pl-4">
              {historial.map((paso) => (
                <li key={paso.id} className="relative">
                  <span className="absolute -left-[23px] top-1 h-3 w-3 rounded-full border-2 border-white bg-slate-400" />
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <Etiqueta estado={paso.estado} />
                    {formatearFecha(paso.created_at)}
                  </div>
                  {paso.comentario && (
                    <p className="mt-1 text-sm text-slate-700">
                      {paso.id !== "creado" && (
                        <span className="font-medium">Municipio: </span>
                      )}
                      {paso.comentario}
                    </p>
                  )}
                </li>
              ))}
            </ol>
          </section>
        </article>
      </div>
    </div>
  );
}
