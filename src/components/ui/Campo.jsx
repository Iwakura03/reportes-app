// Etiqueta + control del formulario, con contador de caracteres opcional
export default function Campo({ id, etiqueta, contador, children }) {
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="text-sm font-medium text-slate-700">
          {etiqueta}
        </label>
        {contador && (
          <span className="text-xs text-slate-500">{contador}</span>
        )}
      </div>
      {children}
    </div>
  );
}
