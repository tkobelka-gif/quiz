import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { usePlayer } from '../context/PlayerContext'
import { questions as allQuestions } from '../data/questions'

const TIMER = 15
const LETTERS = ['A', 'B', 'C', 'D']

export default function PlayPage() {
  const { id: duelId } = useParams()
  const { player, savePlayer } = usePlayer()
  const navigate = useNavigate()

  const [duel, setDuel] = useState(null)
  const [qs, setQs] = useState([])         // question objects in order
  const [idx, setIdx] = useState(0)
  const [timeLeft, setTimeLeft] = useState(TIMER)
  const [chosen, setChosen] = useState(null)  // index 0-3 | 'timeout' | null
  const [collectedAnswers, setCollectedAnswers] = useState([])
  const [phase, setPhase] = useState('loading') // loading | playing | saving

  // Always-current reference to the answer handler (avoids stale closure in timer)
  const handleAnswerRef = useRef(null)
  const hasAnsweredRef = useRef(false)

  useEffect(() => { loadDuel() }, [duelId])

  async function loadDuel() {
    const { data: d } = await supabase.from('duels').select('*').eq('id', duelId).single()
    if (!d) { navigate('/home', { replace: true }); return }
    setDuel(d)

    const { data: dq } = await supabase
      .from('duel_questions')
      .select('question_id, position')
      .eq('duel_id', duelId)
      .order('position')

    if (!dq?.length) { navigate('/home', { replace: true }); return }

    const questions = dq.map(row => allQuestions.find(q => q.id === row.question_id)).filter(Boolean)
    setQs(questions)
    setPhase('playing')
  }

  // Timer – reset on each new question
  useEffect(() => {
    if (phase !== 'playing') return
    hasAnsweredRef.current = false
    setTimeLeft(TIMER)
    setChosen(null)

    const interval = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(interval)
          handleAnswerRef.current?.(null) // timeout
          return 0
        }
        return t - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [phase, idx])

  function handleAnswer(answerIdx) {
    if (hasAnsweredRef.current) return
    hasAnsweredRef.current = true

    const q = qs[idx]
    const isTimeout = answerIdx === null
    const isCorrect = !isTimeout && answerIdx === q.correct

    setChosen(isTimeout ? 'timeout' : answerIdx)

    const newAnswer = {
      duel_id: duelId,
      player_id: player.id,
      question_id: q.id,
      answer: answerIdx,
      is_correct: isCorrect,
    }

    const updatedAnswers = [...collectedAnswers, newAnswer]
    setCollectedAnswers(updatedAnswers)

    setTimeout(() => {
      if (idx + 1 < qs.length) {
        setIdx(i => i + 1)
      } else {
        setPhase('saving')
        submit(updatedAnswers, duel)
      }
    }, 900)
  }

  // Keep ref current each render
  handleAnswerRef.current = handleAnswer

  async function submit(answers, duelData) {
    // 1. Ulož odpovědi
    await supabase
      .from('player_answers')
      .upsert(answers, { onConflict: 'duel_id,player_id,question_id' })

    // 2. Spočítej skóre
    const score = answers.reduce((s, a) => s + (a.is_correct ? 1 : -1), 0)

    // 3. Aktualizuj duel
    const isChallenger = duelData.challenger_id === player.id
    const myField = isChallenger ? 'challenger_score' : 'opponent_score'
    const theirField = isChallenger ? 'opponent_score' : 'challenger_score'

    const { data: updated } = await supabase
      .from('duels')
      .update({ [myField]: score })
      .eq('id', duelId)
      .select()
      .single()

    // 4. Pokud oba hráči hotovi → uzavři duel a přičti body
    if (updated?.[theirField] !== null && updated?.[theirField] !== undefined) {
      const chScore = isChallenger ? score : updated.challenger_score
      const opScore = isChallenger ? updated.opponent_score : score

      await supabase
        .from('duels')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', duelId)

      // Přičti body hráčům (načteme aktuální hodnotu, aby nevznikly konflikty)
      const [{ data: chP }, { data: opP }] = await Promise.all([
        supabase.from('players').select('score').eq('id', duelData.challenger_id).single(),
        supabase.from('players').select('score').eq('id', duelData.opponent_id).single(),
      ])
      if (chP) await supabase.from('players').update({ score: chP.score + chScore }).eq('id', duelData.challenger_id)
      if (opP) await supabase.from('players').update({ score: opP.score + opScore }).eq('id', duelData.opponent_id)

      // Obnov skóre v kontextu
      const { data: me } = await supabase.from('players').select('*').eq('id', player.id).single()
      if (me) savePlayer(me)

      navigate(`/duel/${duelId}/result`, { replace: true })
    } else {
      navigate(`/duel/${duelId}/waiting`, { replace: true })
    }
  }

  if (phase === 'loading' || phase === 'saving') {
    return (
      <div className="min-h-screen bg-indigo-600 flex items-center justify-center">
        <p className="text-white text-xl animate-pulse">
          {phase === 'loading' ? 'Načítám otázky...' : 'Ukládám výsledky...'}
        </p>
      </div>
    )
  }

  const q = qs[idx]
  const timerPct = (timeLeft / TIMER) * 100

  return (
    <div className="min-h-screen bg-indigo-600 flex flex-col">
      {/* Hlavička */}
      <div className="bg-indigo-700 px-4 pt-4 pb-3">
        <div className="max-w-md mx-auto">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-indigo-200">Otázka {idx + 1} / {qs.length}</span>
            <span className={timeLeft <= 5 ? 'text-red-300 font-bold' : 'text-indigo-200'}>
              {timeLeft}s
            </span>
          </div>
          {/* Timer bar */}
          <div className="w-full bg-indigo-800 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-1000 ${timeLeft <= 5 ? 'bg-red-400' : 'bg-white'}`}
              style={{ width: `${timerPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Otázka + odpovědi */}
      <div className="flex-1 flex flex-col px-4 pt-5 pb-6 max-w-md mx-auto w-full">
        <div className="bg-white/10 rounded-2xl p-5 mb-5">
          <p className="text-white text-lg font-semibold leading-snug">{q.question}</p>
        </div>

        <div className="space-y-3">
          {q.options.map((opt, i) => {
            let cls = 'w-full text-left rounded-xl px-4 py-3 font-medium flex items-center gap-3 transition-colors '
            if (chosen === null) {
              cls += 'bg-white text-gray-800 active:bg-indigo-100'
            } else if (i === q.correct) {
              cls += 'bg-green-500 text-white'
            } else if (chosen === i) {
              cls += 'bg-red-500 text-white'
            } else {
              cls += 'bg-white/20 text-white/50'
            }

            return (
              <button
                key={i}
                onClick={() => chosen === null && handleAnswer(i)}
                disabled={chosen !== null}
                className={cls}
              >
                <span className="w-7 h-7 rounded-full bg-black/10 flex items-center justify-center text-sm font-bold shrink-0">
                  {LETTERS[i]}
                </span>
                <span>{opt}</span>
              </button>
            )
          })}
        </div>

        {chosen === 'timeout' && (
          <p className="text-red-300 text-center mt-5 font-semibold">⏰ Čas vypršel! −1 bod</p>
        )}
      </div>
    </div>
  )
}
