import { useEffect, useState } from 'react'
import { supabase } from './lib/supabaseClient'

function App() {
  const [tareas, setTareas] = useState([])
  const [titulo, setTitulo] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  async function cargarTareas() {
    const { data, error } = await supabase
      .from('tareas')
      .select('*')
      .order('id', { ascending: false })

    if (error) {
      setError(error.message)
      return
    }

    setTareas(data)
    setError('')
  }

  useEffect(() => {
    cargarTareas()
  }, [])

  async function agregarTarea(e) {
    e.preventDefault()

    if (!titulo.trim()) return

    setCargando(true)
    setError('')

    const { error } = await supabase
      .from('tareas')
      .insert({ titulo: titulo.trim() })

    if (error) {
      setError(error.message)
    } else {
      setTitulo('')
      await cargarTareas()
    }

    setCargando(false)
  }

  return (
    <main style={{
      maxWidth: '600px',
      margin: '50px auto',
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1>Mi lista de tareas</h1>

      <form onSubmit={agregarTarea}>
        <input
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Escribe una tarea"
          aria-label="Nueva tarea"
        />

        <button type="submit" disabled={cargando}>
          {cargando ? 'Guardando...' : 'Agregar'}
        </button>
      </form>

      {error && <p role="alert">Error: {error}</p>}

      <ul>
        {tareas.map((tarea) => (
          <li key={tarea.id}>{tarea.titulo}</li>
        ))}
      </ul>
    </main>
  )
}

export default App