import { Link } from "react-router";
import { ArrowLeft } from "lucide-react";

// Tarjeta centrada que envuelve los formularios de login y registro
export default function TarjetaAcceso({ titulo, subtitulo, children }) {
  return (
    <div className="px-4 py-10">
      <div className="mx-auto max-w-sm">
        <Link
          to="/"
          className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Regresar al inicio
        </Link>

        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h1 className="text-xl font-bold">{titulo}</h1>
          {subtitulo && <p className="mt-1 text-sm text-slate-600">{subtitulo}</p>}
          <div className="mt-5">{children}</div>
        </div>
      </div>
    </div>
  );
}
