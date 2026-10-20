//importaciones necesarias
import { useEffect, useMemo, useRef, useState } from "react";
//importaciones de react-leaflet
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";
//el formulario, que se muestra encima del mapa.
import FormularioReporte from "./formularioReportes";

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

export default function MapView() {
  const [position, setPosition] = useState(DEFAULT_POSITION);
  // Centro del mapa: solo cambia con la geolocalización, no al arrastrar el marcador
  const [center, setCenter] = useState(DEFAULT_POSITION);
  // Si el navegador no soporta geolocalización, se empieza directamente en "fallback"
  const [status, setStatus] = useState(() =>
    navigator.geolocation ? "loading" : "fallback"
  );
  const [moved, setMoved] = useState(false);
  const markerRef = useRef(null);

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
  }, []);

  const reintentarUbicacion = () => {
    if (!navigator.geolocation) return;
    setStatus("loading");
    obtenerUbicacion({ maximumAge: 0 });
  };
//solo unode los 3 mensajes se ve a la vez, dependiendo del estado de la ubicacion.
  return (
    <div className="w-full space-y-3">
      <div className="rounded-lg bg-gray-100 p-3 text-sm">
        {status === "loading" && (
          <p>Obteniendo ubicación del dispositivo...</p>
        )}

        {status === "success" && (
          <p className="text-green-700">
            Ubicación del dispositivo detectada.
          </p>
        )}

        {status === "fallback" && (
          <p className="text-amber-700">
            No se pudo obtener la ubicación.
            Se muestran las coordenadas predeterminadas.
            Puedes mover el marcador para seleccionar la ubicación deseada.
          </p>
        )}
      </div>

      <div className="relative h-[500px] w-full overflow-hidden rounded-xl shadow-lg">
        <MapContainer
          center={DEFAULT_POSITION}
          zoom={13}
          scrollWheelZoom={true}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapUpdater position={center} />

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

        <button
          type="button"
          onClick={reintentarUbicacion}
          disabled={status === "loading"}
          title="Ir a mi ubicación"
          aria-label="Ir a mi ubicación"
          className="absolute right-3 top-3 z-[1000] flex h-11 w-11 items-center justify-center rounded-full bg-white text-xl shadow-md transition hover:bg-gray-100 disabled:cursor-wait disabled:opacity-60"
                >
          {status === "loading" ? "..." : "GPS"}
        </button>

        {/* Le pasa la posición del marcador, no la del centro, para que el reporte se guarde donde está el pin. */}
        <FormularioReporte position={position} />
      </div>
   
      <p className="text-sm text-gray-600">
        Latitud: {position[0].toFixed(6)} |
        Longitud: {position[1].toFixed(6)}
      </p>
    </div>
  );
}

