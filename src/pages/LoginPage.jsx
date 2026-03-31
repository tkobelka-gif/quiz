import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { usePlayer } from '../context/PlayerContext'

export default function LoginPage() {
  const [name, setName] = useState('')
  const [found, setFound] = useState(null) // player object | false | null
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { player, savePlayer } = usePlayer()
  const navigate = useNavigate()

  useEffect(() => {
    if (player) navigate('/home', { replace: true })
  }, [player])

  async function handleSearch(e) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    setLoading(true)
    setError('')
    const { data } = await supabase
      .from('players')
      .select('*')
      .eq('name', trimmed)
      .maybeSingle()
    setFound(data ?? false)
    setLoading(false)
  }

  async function handleCreate() {
    setLoading(true)
    const { data, error: err } = await supabase
      .from('players')
      .insert({ name: name.trim() })
      .select()
      .single()
    if (err) {
      setError('Nepodařilo se vytvořit účet. Zkus jiné jméno.')
    } else {
      savePlayer(data)
      navigate('/home')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-indigo-600 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <h1 className="text-5xl font-bold text-white text-center mb-1">🧠</h1>
        <h2 className="text-3xl font-bold text-white text-center mb-1">Kvíz</h2>
        <p className="text-indigo-200 text-center mb-8">Rodinná výzva</p>

        <div className="bg-white rounded-2xl p-6 shadow-xl">
          <form onSubmit={handleSearch}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tvoje jméno
            </label>
            <input
              type="text"
              value={name}
              onChange={e => { setName(e.target.value); setFound(null); setError('') }}
              placeholder="Zadej jméno..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
              maxLength={30}
              autoFocus
            />
            <button
              type="submit"
              disabled={!name.trim() || loading}
              className="mt-3 w-full bg-indigo-600 text-white font-semibold rounded-lg py-2.5 disabled:opacity-40"
            >
              {loading ? 'Hledám...' : 'Pokračovat'}
            </button>
          </form>

          {found === false && (
            <div className="mt-5 text-center">
              <p className="text-gray-600 text-sm mb-3">
                Hráč <strong>{name.trim()}</strong> ještě neexistuje.
              </p>
              <button
                onClick={handleCreate}
                disabled={loading}
                className="w-full bg-green-600 text-white font-semibold rounded-lg py-2.5 disabled:opacity-40"
              >
                {loading ? 'Vytvářím...' : '✨ Vytvořit účet'}
              </button>
            </div>
          )}

          {found && (
            <div className="mt-5 text-center">
              <p className="text-gray-600 text-sm mb-1">
                Vítej zpět, <strong>{found.name}</strong>!
              </p>
              <p className="text-indigo-600 font-bold text-lg mb-3">{found.score} bodů</p>
              <button
                onClick={() => { savePlayer(found); navigate('/home') }}
                className="w-full bg-indigo-600 text-white font-semibold rounded-lg py-2.5"
              >
                Hrát →
              </button>
            </div>
          )}

          {error && <p className="mt-3 text-red-600 text-sm text-center">{error}</p>}
        </div>
      </div>
    </div>
  )
}
