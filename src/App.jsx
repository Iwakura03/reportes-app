import { Route, Routes } from "react-router";

import Encabezado from "./components/encabezado";
import Inicio from "./pages/Inicio";
import Login from "./pages/Login";
import Registro from "./pages/Registro";

export default function App() {
  return (
    <div className="min-h-screen bg-white">
      <Encabezado />

      <main className="p-6">
        <Routes>
          <Route path="/" element={<Inicio />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
        </Routes>
      </main>
    </div>
  );
}
