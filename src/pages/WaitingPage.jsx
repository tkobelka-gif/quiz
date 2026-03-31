import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { usePlayer } from '../context/PlayerContext'
import { categories } from '../data/questions'

export default function WaitingPage() {
  const { id: duelId } = useParams()
  const { player } = usePlayer()
  const navigate = useNavigate()
  const [opponentName, setOpponentName] = useState('')
  const [categoryLabel, setCategoryLabel] = useState('')

  useEffect(() => {
    loadDuel()

    const channel = supabase
      .channel(`duel-wait-${duelId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'duels', filter: `id=eq.${duelId}` },
        (payload) => {
          if (payload.new.status === 'completed') {
            navigate(`/duel/${duelId}/result`, { replace: true })
          }
        }
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [duelId])

  async function loadDuel() {
    const { data: d } = await supabase.from('duels').select('*').eq('id', duelId).single()
    if (!d) { navigate('/home', { replace: true }); return }

    if (d.status === 'completed') {
      navigate(`/duel/${duelId}/result`, { replace: true })
      return
    }

    setCategoryLabel(categories.find(c => c.key === d.category)?.label ?? d.category)

    const opponentId = d.challenger_id === player.id ? d.opponent_id : d.challenger_id
    const { data: op } = await supabase.from('players').select('name').eq('id', opponentId).single()
    if (op) setOpponentName(op.name)
  }

  return (
    <div className="min-h-screen bg-indigo-600 flex flex-col items-center justify-center p-4">
      <div className="max-w-sm w-full text-center">
        <div className="text-6xl mb-4 animate-pulse">⏳</div>
        <h1 className="text-2xl font-bold text-white mb-2">Čekám na soupeře</h1>
        {opponentName && (
          <p className="text-indigo-200 mb-1">
            <strong>{opponentName}</strong> musí ještě odehrát.
          </p>
        )}
        {categoryLabel && (
          <p className="text-indigo-300 text-sm mb-1">Téma: {categoryLabel}</p>
        )}
        <p className="text-indigo-300 text-sm mb-8">Soupeř má 3 dny na odpověď.</p>
        <button
          onClick={() => navigate('/home')}
          className="bg-white text-indigo-600 font-bold rounded-xl px-6 py-3 w-full"
        >
          Zpět na hlavní stránku
        </button>
      </div>
    </div>
  )
}
