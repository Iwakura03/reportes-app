//importaciones necesarias
import { useEffect, useMemo, useRef, useState } from "react";
//importaciones de react-leaflet
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  ZoomControl,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { CircleCheck, LoaderCircle, Plus } from "lucide-react";

import "leaflet/dist/leaflet.css";
//el formulario, que se muestra encima del mapa.
import FormularioReporte from "./formularioReportes";
import MarcadorReporte from "./MarcadorReporte";
import FiltroCategorias from "./FiltroCategorias";
import { supabase } from "../lib/supabaseClient";
import { COLUMNAS_REPORTE, cargarCategorias } from "../lib/reportes";

// Coordenadas de magdalena, Jalisco, México. Se usan mientras llega la ubicacion real o si falla.
const DEFAULT_POSITION = [20.9086744, -103.9815141];

// Componente encargado de mover el mapa
function MapUpdater({ position }) {
  const map = useMap();

  useEffect(() => {
    map.flyTo(position, 15, {
      animate: true,
      duration: 1,
    });
  }, [position, map]);

  return null;
}

// Al abrir el formulario en móvil, sube el pin para que no quede tapado por la hoja inferior
function EnfocarPin({ position, activo }) {
  const map = useMap();

  useEffect(() => {
    if (!activo || window.innerWidth >= 640) return;
    const zoom = map.getZoom();
    const punto = map.project(position, zoom);
    punto.y += map.getSize().y * 0.3;
    map.panTo(map.unproject(punto, zoom));
    // Solo al abrir; no se quiere mover el mapa cada vez que cambia el pin
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activo, map]);

  return null;
}

// Con el formulario abierto, tocar el mapa mueve el pin a ese punto
function SelectorUbicacion({ activo, onSeleccionar }) {
  useMapEvents({
    click(evento) {
      if (activo) onSeleccionar([evento.latlng.lat, evento.latlng.lng]);
    },
  });

  return null;
}

// Aviso pequeño que flota sobre el mapa
function Aviso({ tono = "info", children }) {
  const tonos = {
    info: "bg-white text-slate-700",
    exito: "bg-green-600 text-white",
    alerta: "bg-amber-50 text-amber-800",
    error: "bg-red-50 text-red-700",
  };

  return (
    <div
      role="status"
      className={`pointer-events-auto flex w-fit max-w-full items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium shadow-md ${tonos[tono]}`}
    >
      {children}
    </div>
  );
}

export default function MapView() {
  const [position, setPosition] = useState(DEFAULT_POSITION);
  // Centro del mapa: solo cambia con la geolocalización, no al arrastrar el marcador
  const [center, setCenter] = useState(DEFAULT_POSITION);
  // Si el navegador no soporta geolocalización, se empieza directamente en "fallback"
  const [status, setStatus] = useState(() =>
    navigator.geolocation ? "loading" : "fallback"
  );
  // El aviso de "ubicación detectada" se oculta solo después de unos segundos
  const [avisoUbicacionVisible, setAvisoUbicacionVisible] = useState(true);
  const [moved, setMoved] = useState(false);
  const markerRef = useRef(null);
  // Reportes ya guardados, cada uno se dibuja con su marcador
  const [reportes, setReportes] = useState([]);
  const [errorReportes, setErrorReportes] = useState(false);
  const [categorias, setCategorias] = useState([]);
  const [cargandoCategorias, setCargandoCategorias] = useState(true);
  const [errorCategorias, setErrorCategorias] = useState(false);
  // id de la categoría filtrada, o null para ver todas
  const [filtro, setFiltro] = useState(null);
  const [formAbierto, setFormAbierto] = useState(false);
  // id del reporte recién creado, para abrir su popup
  const [reporteNuevoId, setReporteNuevoId] = useState(null);
  const [mensajeExito, setMensajeExito] = useState(false);
  const temporizadores = useRef([]);

  // Ejecuta una función después de unos segundos; se cancela al desmontar
  const despues = (ms, fn) => {
    temporizadores.current.push(setTimeout(fn, ms));
  };

  useEffect(() => {
    const pendientes = temporizadores.current;
    return () => pendientes.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    let cancelado = false;

    supabase
      .from("reportes")
      .select(COLUMNAS_REPORTE)
      .order("created_at", { ascending: false })
      .limit(500)
      .then(({ data, error }) => {
        if (cancelado) return;
        if (error) {
          console.error(error);
          setErrorReportes(true);
          return;
        }
        setReportes(data);
      });

    cargarCategorias().then(({ data, error }) => {
      if (cancelado) return;
      if (error) {
        console.error(error);
        setErrorCategorias(true);
      } else {
        setCategorias(data);
      }
      setCargandoCategorias(false);
    });

    return () => {
      cancelado = true;
    };
  }, []);

  const reportesVisibles =
    filtro === null
      ? reportes
      : reportes.filter((reporte) => reporte.categoria_id === filtro);

  // El formulario llama a esto con el reporte recién insertado
  const agregarReporte = (reporte) => {
    setReportes((anteriores) => [reporte, ...anteriores]);
    setReporteNuevoId(reporte.id);
    setFiltro(null);
    setFormAbierto(false);
    setMensajeExito(true);
    despues(4000, () => setMensajeExito(false));
  };

  const seleccionarUbicacion = (nueva) => {
    setPosition(nueva);
    setMoved(true);
  };

  //eventos del marcador, para actualizar la posición cuando se arrastra
  const markerEvents = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker) {
          const { lat, lng } = marker.getLatLng();
          setPosition([lat, lng]);
          setMoved(true);
        }
      },
    }),
    []
  );
  //funcion para obtener la ubicacion del dispositivo.
  //Solo actualiza el estado dentro de los callbacks (cuando llega la respuesta del navegador).
  const obtenerUbicacion = (opciones = {}) => {
    navigator.geolocation.getCurrentPosition(
      (location) => {
        const { latitude, longitude } = location.coords;

        setPosition([latitude, longitude]);
        setCenter([latitude, longitude]);
        setMoved(false);
        setStatus("success");
        setAvisoUbicacionVisible(true);
        despues(3000, () => setAvisoUbicacionVisible(false));
      },
      () => {
        // Si falla, se mantienen las coordenadas predeterminadas
        setStatus("fallback");
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 60000,
        ...opciones
      }
    );
  };
  //pide la ubicacion al cargar, se ejecuta solo una vez, por eso el vacio []
  useEffect(() => {
    if (navigator.geolocation) obtenerUbicacion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reintentarUbicacion = () => {
    if (!navigator.geolocation) return;
    setStatus("loading");
    obtenerUbicacion({ maximumAge: 0 });
  };

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={DEFAULT_POSITION}
        zoom={13}
        scrollWheelZoom={true}
        zoomControl={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ZoomControl position="bottomright" />

        <MapUpdater position={center} />
        <EnfocarPin position={position} activo={formAbierto} />
        <SelectorUbicacion
          activo={formAbierto}
          onSeleccionar={seleccionarUbicacion}
        />

        {reportesVisibles.map((reporte) => (
          <MarcadorReporte
            key={reporte.id}
            reporte={reporte}
            abrir={reporte.id === reporteNuevoId}
          />
        ))}

        <Marker
          position={position}
          draggable={true}
          eventHandlers={markerEvents}
          ref={markerRef}
        >
          <Popup>
            {moved
              ? "Ubicación seleccionada"
              : status === "success"
              ? "Ubicación actual del dispositivo"
              : "Ubicación predeterminada"}
          </Popup>
        </Marker>
      </MapContainer>

      {/* Filtro y avisos arriba del mapa. pointer-events-none deja pasar los toques al mapa entre los chips. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[1000] space-y-2 p-3">
        {categorias.length > 0 && (
          <FiltroCategorias
            categorias={categorias}
            seleccionada={filtro}
            onCambiar={setFiltro}
          />
        )}

        {status === "loading" && (
          <Aviso>
            <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
            Buscando tu ubicación...
          </Aviso>
        )}

        {status === "success" && avisoUbicacionVisible && (
          <Aviso>
            <CircleCheck className="h-3.5 w-3.5 text-green-600" />
            Ubicación detectada
          </Aviso>
        )}

        {status === "fallback" && (
          <Aviso tono="alerta">
            No se pudo obtener tu ubicación.
            <button
              type="button"
              onClick={reintentarUbicacion}
              className="underline hover:no-underline"
            >
              Reintentar
            </button>
          </Aviso>
        )}

        {errorReportes && (
          <Aviso tono="error">No se pudieron cargar los reportes.</Aviso>
        )}

        {mensajeExito && (
          <Aviso tono="exito">
            <CircleCheck className="h-3.5 w-3.5" />
            ¡Reporte enviado! Gracias.
          </Aviso>
        )}
      </div>

      <button
        type="button"
        onClick={reintentarUbicacion}
        disabled={status === "loading"}
        title="Ir a mi ubicación"
        aria-label="Ir a mi ubicación"
        className="absolute bottom-28 right-2.5 z-[1000] flex h-11 w-11 items-center justify-center rounded-full bg-white text-xs font-semibold text-slate-700 shadow-md transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-500 disabled:cursor-wait disabled:opacity-60"
      >
        {status === "loading" ? "..." : "GPS"}
      </button>

      {!formAbierto && (
        <button
          type="button"
          onClick={() => setFormAbierto(true)}
          className="absolute bottom-6 left-1/2 z-[1000] flex -translate-x-1/2 items-center gap-2 rounded-full bg-marca-600 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-marca-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-500 focus-visible:ring-offset-2"
        >
          <Plus className="h-5 w-5" />
          Reportar un problema
        </button>
      )}

      {/* Le pasa la posición del marcador, no la del centro, para que el reporte se guarde donde está el pin. */}
      <FormularioReporte
        position={position}
        categorias={categorias}
        cargandoCategorias={cargandoCategorias}
        errorCategorias={errorCategorias}
        abierto={formAbierto}
        onCerrar={() => setFormAbierto(false)}
        onReporteCreado={agregarReporte}
      />
    </div>
  );
}
