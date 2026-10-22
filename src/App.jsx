import { Route, Routes } from "react-router";

import Encabezado from "./components/encabezado";
import Inicio from "./pages/Inicio";
import Login from "./pages/Login";
import Registro from "./pages/Registro";
import RecuperarContrasena from "./pages/RecuperarContrasena";
import NuevaContrasena from "./pages/NuevaContrasena";

export default function App() {
  return (
    <div className="flex h-svh flex-col">
      <Encabezado />

      {/* El mapa ocupa todo el alto disponible; las demás páginas hacen scroll aquí */}
      <main className="relative flex-1 overflow-y-auto">
        <Routes>
          <Route path="/" element={<Inicio />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/recuperar" element={<RecuperarContrasena />} />
          <Route path="/nueva-contrasena" element={<NuevaContrasena />} />
        </Routes>
      </main>
    </div>
  );
}
