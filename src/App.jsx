import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/UI/Navbar'
import HomePage from './pages/HomePage'
import RulesPage from './pages/RulesPage'
import GamePage from './pages/GamePage'
import LobbyPage from './pages/LobbyPage'
import RoomPage from './pages/RoomPage'
import MultiGamePage from './pages/MultiGamePage'
import './App.css'

export default function App() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Routes>
          <Route path="/"                    element={<HomePage />} />
          <Route path="/rules"               element={<RulesPage />} />
          <Route path="/game"                element={<GamePage />} />
          <Route path="/lobby"               element={<LobbyPage />} />
          <Route path="/room/:roomCode"      element={<RoomPage />} />
          <Route path="/multiplayer/:roomCode" element={<MultiGamePage />} />
          <Route path="*"                    element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}
