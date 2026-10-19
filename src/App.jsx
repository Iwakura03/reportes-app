import Mapa from "./components/Mapa";

export default function App() {
  return (
    <main className="min-h-screen bg-white p-6">
      <h1 className="mb-5 text-2xl font-bold">
        Ubicación del dispositivo
      </h1>

      <Mapa />
    </main>
  );
}