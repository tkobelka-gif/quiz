import { Routes, Route, Navigate } from 'react-router-dom'
import { usePlayer } from './context/PlayerContext'
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
import NewDuelPage from './pages/NewDuelPage'
import TopicSelectPage from './pages/TopicSelectPage'
import PlayPage from './pages/PlayPage'
import WaitingPage from './pages/WaitingPage'
import ResultPage from './pages/ResultPage'

function Protected({ children }) {
  const { player } = usePlayer()
  return player ? children : <Navigate to="/" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/"                    element={<LoginPage />} />
      <Route path="/home"                element={<Protected><HomePage /></Protected>} />
      <Route path="/new-duel"            element={<Protected><NewDuelPage /></Protected>} />
      <Route path="/new-duel/topic"      element={<Protected><TopicSelectPage /></Protected>} />
      <Route path="/duel/:id/play"       element={<Protected><PlayPage /></Protected>} />
      <Route path="/duel/:id/waiting"    element={<Protected><WaitingPage /></Protected>} />
      <Route path="/duel/:id/result"     element={<Protected><ResultPage /></Protected>} />
      <Route path="*"                    element={<Navigate to="/" replace />} />
    </Routes>
  )
}
