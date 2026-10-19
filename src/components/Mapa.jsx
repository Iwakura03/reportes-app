
import { useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";

import FormularioReporte from "./formularioReportes";

// Coordenadas de magdalena, Jalisco, México
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
  const [status, setStatus] = useState("loading");
  const [moved, setMoved] = useState(false);
  const markerRef = useRef(null);

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

  useEffect(() => {
    if (!navigator.geolocation) {
      setStatus("fallback");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (location) => {
        const { latitude, longitude } = location.coords;

        setPosition([latitude, longitude]);
        setCenter([latitude, longitude]);
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
      }
    );
  }, []);

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

        <FormularioReporte position={position} />
      </div>

      <p className="text-sm text-gray-600">
        Latitud: {position[0].toFixed(6)} |
        Longitud: {position[1].toFixed(6)}
      </p>
    </div>
  );
}
