import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { usePlayer } from '../context/PlayerContext'
import { categories } from '../data/questions'

export default function ResultPage() {
  const { id: duelId } = useParams()
  const { player } = usePlayer()
  const navigate = useNavigate()
  const [duel, setDuel] = useState(null)
  const [challengerName, setChallengerName] = useState('')
  const [opponentName, setOpponentName] = useState('')

  useEffect(() => {
    loadResult()
  }, [duelId])

  async function loadResult() {
    const { data: d } = await supabase.from('duels').select('*').eq('id', duelId).single()
    if (!d) { navigate('/home', { replace: true }); return }
    setDuel(d)

    const [{ data: ch }, { data: op }] = await Promise.all([
      supabase.from('players').select('name').eq('id', d.challenger_id).single(),
      supabase.from('players').select('name').eq('id', d.opponent_id).single(),
    ])
    setChallengerName(ch?.name ?? '')
    setOpponentName(op?.name ?? '')
  }

  if (!duel) {
    return (
      <div className="min-h-screen bg-indigo-600 flex items-center justify-center">
        <p className="text-white">Načítám výsledky...</p>
      </div>
    )
  }

  const isChallenger = duel.challenger_id === player.id
  const myScore = isChallenger ? duel.challenger_score : duel.opponent_score
  const theirScore = isChallenger ? duel.opponent_score : duel.challenger_score
  const myName = player.name
  const theirName = isChallenger ? opponentName : challengerName
  const categoryLabel = categories.find(c => c.key === duel.category)?.label ?? duel.category

  let emoji, text, textColor
  if (myScore > theirScore)       { emoji = '🏆'; text = 'Vyhrál/a jsi!';  textColor = 'text-yellow-300' }
  else if (myScore < theirScore)  { emoji = '😔'; text = 'Prohrál/a jsi.'; textColor = 'text-red-300' }
  else                            { emoji = '🤝'; text = 'Remíza!';         textColor = 'text-white' }

  function scoreColor(s) {
    return s >= 0 ? 'text-green-300' : 'text-red-300'
  }

  return (
    <div className="min-h-screen bg-indigo-600 flex flex-col items-center justify-center p-4">
      <div className="max-w-sm w-full">
        <div className="text-center mb-6">
          <div className="text-6xl mb-2">{emoji}</div>
          <h1 className={`text-3xl font-bold ${textColor}`}>{text}</h1>
          <p className="text-indigo-200 mt-1 text-sm">{categoryLabel}</p>
        </div>

        <div className="bg-white/10 rounded-2xl p-5 mb-6">
          <div className="flex justify-around items-center">
            <div className="text-center">
              <p className="text-indigo-200 text-sm truncate max-w-28">{myName}</p>
              <p className={`text-4xl font-bold mt-1 ${scoreColor(myScore)}`}>
                {myScore >= 0 ? '+' : ''}{myScore}
              </p>
            </div>
            <div className="text-white/30 text-xl">vs</div>
            <div className="text-center">
              <p className="text-indigo-200 text-sm truncate max-w-28">{theirName}</p>
              <p className={`text-4xl font-bold mt-1 ${scoreColor(theirScore)}`}>
                {theirScore >= 0 ? '+' : ''}{theirScore}
              </p>
            </div>
          </div>
          <p className="text-center text-indigo-300 text-xs mt-4">
            (+1 správná / −1 špatná nebo timeout)
          </p>
        </div>

        <button
          onClick={() => navigate('/home')}
          className="w-full bg-white text-indigo-600 font-bold rounded-xl py-3 text-lg"
        >
          Zpět na hlavní stránku
        </button>
      </div>
    </div>
  )
}
