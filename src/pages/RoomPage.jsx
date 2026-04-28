import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import * as api from '../api/gameApi'
import styles from './RoomPage.module.css'

const SLOT_COLORS = ['#27ae60', '#e74c3c', '#f1c40f', '#3498db']

export default function RoomPage() {
  const { roomCode }   = useParams()
  const location       = useLocation()
  const nav            = useNavigate()
  const sessionRef     = useRef(location.state)   // { token, myName, isHost }

  const [lobby, setLobby]   = useState(null)
  const [error, setError]   = useState('')
  const [starting, setStarting] = useState(false)

  const session = sessionRef.current

  // Redirect if arrived without session state (e.g. direct URL)
  useEffect(() => {
    if (!session?.token) nav('/lobby', { replace: true })
  }, [])

  // Poll lobby state every 2 seconds
  useEffect(() => {
    if (!session?.token) return
    let alive = true

    const fetchLobby = () => {
      api.getLobby(roomCode, session.token)
        .then(data => {
          if (!alive) return
          setLobby(data)
          // Game started → go to multiplayer game
          if (data.roomState === 'IN_PROGRESS') {
            nav(`/multiplayer/${roomCode}`, {
              replace: true,
              state: { token: session.token, myName: session.myName }
            })
          }
        })
        .catch(() => { /* ignore transient errors */ })
    }

    fetchLobby()
    const interval = setInterval(fetchLobby, 2000)
    return () => { alive = false; clearInterval(interval) }
  }, [roomCode])

  // Heartbeat every 10 seconds
  useEffect(() => {
    if (!session?.token) return
    const hb = setInterval(() => api.heartbeat(roomCode, session.token), 10000)
    return () => clearInterval(hb)
  }, [roomCode])

  const handleStart = async () => {
    setStarting(true); setError('')
    try {
      await api.startRoom(roomCode, session.token)
      // Redirect will happen via lobby poll detecting IN_PROGRESS
    } catch (e) {
      setError(e?.response?.data?.message || e.message || 'Could not start game.')
      setStarting(false)
    }
  }

  const handleKick = (playerName) => {
    api.kickPlayer(roomCode, session.token, playerName).catch(() => {})
  }

  const handleLeave = () => {
    api.leaveRoom(roomCode, session.token).catch(() => {})
    nav('/lobby', { replace: true })
  }

  const copyCode = () => {
    navigator.clipboard?.writeText(roomCode).catch(() => {})
  }

  if (!session?.token) return null

  const slots       = lobby?.slots ?? Array(4).fill(null).map((_, i) => ({ index: i, playerName: null, host: false, connected: false }))
  const isHost      = lobby?.host ?? session.isHost
  const filledCount = slots.filter(s => s.playerName).length
  const canStart    = isHost && filledCount >= 1

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h2 className={styles.title}>Waiting Room</h2>

        {/* Room code */}
        <div className={styles.codeBox}>
          <span className={styles.codeLabel}>Room Code</span>
          <div className={styles.codeRow}>
            <span className={styles.code}>{roomCode}</span>
            <button className={styles.copyBtn} onClick={copyCode} title="Copy code">⎘</button>
          </div>
          <p className={styles.codeHint}>Share this code with friends to invite them.</p>
        </div>

        {/* Player slots */}
        <div className={styles.slotList}>
          {slots.map((slot, i) => (
            <div
              key={i}
              className={`${styles.slot} ${slot.playerName ? styles.slotFilled : styles.slotEmpty}`}
              style={slot.playerName ? { '--sc': SLOT_COLORS[i] } : {}}
            >
              <div className={styles.slotDot} />
              <div className={styles.slotInfo}>
                {slot.playerName ? (
                  <>
                    <span className={styles.slotName}>{slot.playerName}</span>
                    <span className={styles.slotTags}>
                      {slot.host && <span className={styles.tagHost}>Host</span>}
                      {!slot.connected && <span className={styles.tagDisc}>Disconnected</span>}
                    </span>
                  </>
                ) : (
                  <span className={styles.slotWaiting}>Waiting for player…</span>
                )}
              </div>
              {/* Host can kick other players */}
              {isHost && slot.playerName && slot.playerName !== session.myName && (
                <button className={styles.kickBtn} onClick={() => handleKick(slot.playerName)} title="Kick">✕</button>
              )}
            </div>
          ))}
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.actions}>
          {isHost && (
            <button
              className={styles.btnStart}
              onClick={handleStart}
              disabled={!canStart || starting}
            >
              {starting ? 'Starting…' : `Start Game (${filledCount}/4)`}
            </button>
          )}
          {!isHost && (
            <p className={styles.waitMsg}>Waiting for the host to start the game…</p>
          )}
          <button className={styles.btnLeave} onClick={handleLeave}>
            Leave Room
          </button>
        </div>
      </div>
    </div>
  )
}
