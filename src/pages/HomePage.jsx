import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { usePlayer } from '../context/PlayerContext'
import { categories } from '../data/questions'

export default function HomePage() {
  const { player, savePlayer, logout } = usePlayer()
  const navigate = useNavigate()
  const [leaderboard, setLeaderboard] = useState([])
  const [duels, setDuels] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAll()
    expireOldDuels()

    const channel = supabase
      .channel('home-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, loadLeaderboard)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'duels' }, loadDuels)
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  async function loadAll() {
    await Promise.all([loadLeaderboard(), loadDuels(), refreshPlayer()])
    setLoading(false)
  }

  async function refreshPlayer() {
    const { data } = await supabase.from('players').select('*').eq('id', player.id).single()
    if (data) savePlayer(data)
  }

  async function loadLeaderboard() {
    const { data } = await supabase
      .from('players')
      .select('id, name, score')
      .order('score', { ascending: false })
      .limit(20)
    setLeaderboard(data || [])
  }

  async function loadDuels() {
    const { data } = await supabase
      .from('duels')
      .select(`
        id, category, status, challenger_id, opponent_id, challenger_score, opponent_score,
        challenger:challenger_id(id, name),
        opponent:opponent_id(id, name)
      `)
      .or(`challenger_id.eq.${player.id},opponent_id.eq.${player.id}`)
      .eq('status', 'waiting')
      .order('created_at', { ascending: false })
    setDuels(data || [])
  }

  async function expireOldDuels() {
    const { data: expired } = await supabase
      .from('duels')
      .select('id, challenger_id, opponent_id, challenger_score')
      .eq('status', 'waiting')
      .lt('expires_at', new Date().toISOString())

    if (!expired?.length) return

    for (const d of expired) {
      await supabase.from('duels').update({ status: 'expired' }).eq('id', d.id)

      if (d.challenger_score !== null) {
        const { data: ch } = await supabase.from('players').select('score').eq('id', d.challenger_id).single()
        if (ch) await supabase.from('players').update({ score: ch.score + d.challenger_score }).eq('id', d.challenger_id)
      }
      const { data: op } = await supabase.from('players').select('score').eq('id', d.opponent_id).single()
      if (op) await supabase.from('players').update({ score: op.score - 2 }).eq('id', d.opponent_id)
    }

    loadDuels()
    loadLeaderboard()
  }

  function getCategoryLabel(key) {
    return categories.find(c => c.key === key)?.label ?? key
  }

  return (
    <div className="min-h-screen bg-indigo-50">
      {/* Hlavička */}
      <div className="bg-indigo-600 text-white px-4 py-4">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div>
            <p className="text-indigo-200 text-xs">Přihlášen jako</p>
            <p className="font-bold text-lg leading-tight">{player.name}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-indigo-200 text-xs">Body</p>
              <p className="font-bold text-2xl leading-tight">{player.score}</p>
            </div>
            <button
              onClick={logout}
              className="text-indigo-200 text-sm border border-indigo-400 rounded-lg px-2 py-1"
            >
              Odhlásit
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-4 space-y-5">
        {/* Nový duel */}
        <button
          onClick={() => navigate('/new-duel')}
          className="w-full bg-indigo-600 text-white font-bold rounded-xl py-3 text-lg shadow active:bg-indigo-700"
        >
          ⚔️ Nový duel
        </button>

        {/* Aktivní duely */}
        {loading ? (
          <p className="text-gray-400 text-sm text-center py-4">Načítám...</p>
        ) : duels.length > 0 && (
          <div>
            <h2 className="font-bold text-gray-700 mb-2">Aktivní duely</h2>
            <div className="space-y-2">
              {duels.map(duel => {
                const isChallenger = duel.challenger_id === player.id
                const other = isChallenger ? duel.opponent : duel.challenger
                const myTurn = isChallenger
                  ? duel.challenger_score === null
                  : duel.challenger_score !== null && duel.opponent_score === null

                return (
                  <div key={duel.id} className="bg-white rounded-xl px-4 py-3 shadow-sm flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-800 truncate">{other?.name}</p>
                      <p className="text-sm text-gray-500">{getCategoryLabel(duel.category)}</p>
                    </div>
                    {myTurn ? (
                      <button
                        onClick={() => navigate(`/duel/${duel.id}/play`)}
                        className="bg-indigo-600 text-white text-sm font-semibold px-3 py-1.5 rounded-lg shrink-0"
                      >
                        Hrát →
                      </button>
                    ) : (
                      <span className="text-gray-400 text-sm shrink-0">Čekám...</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Žebříček */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-gray-700">🏆 Žebříček</h2>
            <button onClick={loadLeaderboard} className="text-indigo-600 text-sm">Obnovit</button>
          </div>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {leaderboard.map((row, i) => (
              <div
                key={row.id}
                className={`flex items-center px-4 py-3 ${i < leaderboard.length - 1 ? 'border-b border-gray-100' : ''} ${row.id === player.id ? 'bg-indigo-50' : ''}`}
              >
                <span className="w-7 text-gray-400 text-sm font-medium">{i + 1}.</span>
                <span className="flex-1 font-medium text-gray-800">{row.name}</span>
                <span className={`font-bold ${row.id === player.id ? 'text-indigo-600' : 'text-gray-700'}`}>
                  {row.score}
                </span>
              </div>
            ))}
            {leaderboard.length === 0 && (
              <p className="text-gray-400 text-center py-6 text-sm">Žádní hráči</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
