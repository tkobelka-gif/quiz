import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { usePlayer } from '../context/PlayerContext'
import { categories, getRandom } from '../data/questions'

const EMOJI = {
  matematika:   '🔢',
  cestina:      '📚',
  zahradkareni: '🌱',
  zvirata:      '🐾',
  rostliny:     '🌿',
  ceske_zvyky:  '🇨🇿',
  veda:         '🔬',
  technologie:  '💻',
  filmy:        '🎬',
  umeni:        '🎨',
  lidske_telo:  '🫀',
}

export default function TopicSelectPage() {
  const { player } = usePlayer()
  const navigate = useNavigate()
  const { state } = useLocation()
  const opponent = state?.opponent
  const [loading, setLoading] = useState(false)

  if (!opponent) {
    navigate('/new-duel', { replace: true })
    return null
  }

  async function handleSelect(cat) {
    setLoading(true)

    const picked = getRandom(cat.key, 5)
    if (picked.length < 5) {
      alert(`Kategorie ${cat.label} nemá dostatek otázek.`)
      setLoading(false)
      return
    }

    // Vytvoř duel
    const { data: duel, error } = await supabase
      .from('duels')
      .insert({ challenger_id: player.id, opponent_id: opponent.id, category: cat.key })
      .select()
      .single()

    if (error || !duel) {
      alert('Nepodařilo se vytvořit duel.')
      setLoading(false)
      return
    }

    // Přiřaď 5 otázek
    const { error: dqErr } = await supabase
      .from('duel_questions')
      .insert(picked.map((q, i) => ({ duel_id: duel.id, question_id: q.id, position: i + 1 })))

    if (dqErr) {
      alert('Nepodařilo se přiřadit otázky.')
      await supabase.from('duels').delete().eq('id', duel.id)
      setLoading(false)
      return
    }

    navigate(`/duel/${duel.id}/play`)
  }

  return (
    <div className="min-h-screen bg-indigo-50">
      <div className="bg-indigo-600 text-white px-4 py-4">
        <div className="max-w-md mx-auto">
          <button onClick={() => navigate('/new-duel')} className="text-indigo-200 text-sm mb-1">← Zpět</button>
          <h1 className="font-bold text-lg">Vyber téma</h1>
          <p className="text-indigo-200 text-sm">Soupeř: {opponent.name}</p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-4">
        <div className="grid grid-cols-2 gap-3">
          {categories.map(cat => (
            <button
              key={cat.key}
              onClick={() => handleSelect(cat)}
              disabled={loading}
              className="bg-white rounded-xl p-4 shadow-sm text-center active:scale-95 transition-transform disabled:opacity-50"
            >
              <div className="text-4xl mb-1">{EMOJI[cat.key]}</div>
              <div className="font-semibold text-gray-800 text-sm leading-tight">{cat.label}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
