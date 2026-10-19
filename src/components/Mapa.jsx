
import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";

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
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    if (!navigator.geolocation) {
      setStatus("fallback");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (location) => {
        const { latitude, longitude } = location.coords;

        setPosition([latitude, longitude]);
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
          </p>
        )}
      </div>

      <div className="h-[500px] w-full overflow-hidden rounded-xl shadow-lg">
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

          <MapUpdater position={position} />

          <Marker position={position}>
            <Popup>
              {status === "success"
                ? "Ubicación actual del dispositivo"
                : "Ubicación predeterminada"}
            </Popup>
          </Marker>
        </MapContainer>
      </div>

      <p className="text-sm text-gray-600">
        Latitud: {position[0].toFixed(6)} |
        Longitud: {position[1].toFixed(6)}
      </p>
    </div>
  );
}
