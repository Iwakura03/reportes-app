// Chips con el color de cada categoría: sirven de leyenda y de filtro.
// seleccionada es el id de la categoría o null para mostrar todas.
export default function FiltroCategorias({ categorias, seleccionada, onCambiar }) {
  const claseChip = (activo) =>
    `flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium shadow-md transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-500 ${
      activo
        ? "bg-slate-900 text-white"
        : "bg-white text-slate-700 hover:bg-slate-100"
    }`;

  return (
    <div className="pointer-events-auto flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
      <button
        type="button"
        onClick={() => onCambiar(null)}
        aria-pressed={seleccionada === null}
        className={claseChip(seleccionada === null)}
      >
        Todas
      </button>

      {categorias.map((categoria) => (
        <button
          key={categoria.id}
          type="button"
          onClick={() =>
            onCambiar(seleccionada === categoria.id ? null : categoria.id)
          }
          aria-pressed={seleccionada === categoria.id}
          className={claseChip(seleccionada === categoria.id)}
        >
          <span
            className="h-2.5 w-2.5 rounded-full ring-1 ring-white"
            style={{ background: categoria.color ?? "#475569" }}
          />
          {categoria.nombre}
        </button>
      ))}
    </div>
  );
}
