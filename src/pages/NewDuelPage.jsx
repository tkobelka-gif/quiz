import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { usePlayer } from '../context/PlayerContext'

export default function NewDuelPage() {
  const { player } = usePlayer()
  const navigate = useNavigate()
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(null) // id of player being checked

  useEffect(() => {
    supabase
      .from('players')
      .select('id, name, score')
      .neq('id', player.id)
      .order('score', { ascending: false })
      .then(({ data }) => {
        setPlayers(data || [])
        setLoading(false)
      })
  }, [])

  async function handleSelect(opponent) {
    setChecking(opponent.id)

    // Max 3 aktivní duely mezi stejnými hráči
    const { count } = await supabase
      .from('duels')
      .select('*', { count: 'exact', head: true })
      .or(
        `and(challenger_id.eq.${player.id},opponent_id.eq.${opponent.id}),` +
        `and(challenger_id.eq.${opponent.id},opponent_id.eq.${player.id})`
      )
      .eq('status', 'waiting')

    setChecking(null)

    if (count >= 3) {
      alert(`Máš už 3 aktivní duely s hráčem ${opponent.name}.`)
      return
    }

    navigate('/new-duel/topic', { state: { opponent } })
  }

  return (
    <div className="min-h-screen bg-indigo-50">
      <div className="bg-indigo-600 text-white px-4 py-4">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <button onClick={() => navigate('/home')} className="text-indigo-200 text-lg">←</button>
          <h1 className="font-bold text-lg">Vyber soupeře</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-4">
        {loading ? (
          <p className="text-center text-gray-500 py-10">Načítám hráče...</p>
        ) : players.length === 0 ? (
          <p className="text-center text-gray-500 py-10">
            Zatím žádní další hráči.<br />
            <span className="text-sm">Pozvěte přátele, ať se zaregistrují.</span>
          </p>
        ) : (
          <div className="space-y-2">
            {players.map(p => (
              <button
                key={p.id}
                onClick={() => handleSelect(p)}
                disabled={checking !== null}
                className="w-full bg-white rounded-xl px-4 py-3 shadow-sm flex items-center justify-between text-left disabled:opacity-60"
              >
                <div>
                  <p className="font-semibold text-gray-800">{p.name}</p>
                  <p className="text-sm text-gray-500">{p.score} bodů</p>
                </div>
                <span className="text-indigo-600 font-bold text-sm">
                  {checking === p.id ? '...' : 'Vyzvat →'}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
