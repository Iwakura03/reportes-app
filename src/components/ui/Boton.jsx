import { LoaderCircle } from "lucide-react";

const VARIANTES = {
  primario: "bg-marca-600 text-white hover:bg-marca-700",
  secundario:
    "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
};

// Botón de ancho completo; con cargando=true muestra un spinner y se deshabilita
export default function Boton({
  variante = "primario",
  cargando = false,
  icono: Icono,
  type = "button",
  disabled,
  className = "",
  children,
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || cargando}
      className={`flex w-full items-center justify-center gap-2 rounded-lg p-2.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTES[variante]} ${className}`}
      {...props}
    >
      {cargando ? (
        <LoaderCircle className="h-4 w-4 animate-spin" />
      ) : (
        Icono && <Icono className="h-4 w-4" />
      )}
      {children}
    </button>
  );
}
