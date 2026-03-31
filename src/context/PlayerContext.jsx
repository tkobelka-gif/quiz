import { createContext, useContext, useState } from 'react'

const PlayerContext = createContext(null)

export function PlayerProvider({ children }) {
  const [player, setPlayer] = useState(() => {
    try {
      const saved = localStorage.getItem('quiz_player')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  function savePlayer(p) {
    localStorage.setItem('quiz_player', JSON.stringify(p))
    setPlayer(p)
  }

  function logout() {
    localStorage.removeItem('quiz_player')
    setPlayer(null)
  }

  return (
    <PlayerContext.Provider value={{ player, savePlayer, logout }}>
      {children}
    </PlayerContext.Provider>
  )
}

export function usePlayer() {
  return useContext(PlayerContext)
}
