import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as api from '../api/gameApi'
import styles from './LobbyPage.module.css'

export default function LobbyPage() {
  const nav = useNavigate()
  const [name, setName]       = useState('')
  const [code, setCode]       = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const trimName = name.trim()
  const trimCode = code.trim().toUpperCase()

  const handleSolo = () => {
    if (!trimName) { setError('Enter your name first.'); return }
    nav('/game', { state: { playerName: trimName } })
  }

  const handleCreate = async () => {
    if (!trimName) { setError('Enter your name first.'); return }
    setLoading(true); setError('')
    try {
      const lobby = await api.createRoom(trimName)
      nav(`/room/${lobby.roomCode}`, {
        state: { token: lobby.sessionToken, myName: trimName, isHost: true }
      })
    } catch (e) {
      setError(e?.response?.data?.message || e.message || 'Could not create room.')
      setLoading(false)
    }
  }

  const handleJoin = async () => {
    if (!trimName) { setError('Enter your name first.'); return }
    if (!trimCode) { setError('Enter a room code.'); return }
    setLoading(true); setError('')
    try {
      const lobby = await api.joinRoom(trimCode, trimName)
      nav(`/room/${lobby.roomCode}`, {
        state: { token: lobby.sessionToken, myName: trimName, isHost: false }
      })
    } catch (e) {
      setError(e?.response?.data?.message || e.message || 'Could not join room.')
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.suits}>♦ ♠ ♣ ♥</div>
        <h1 className={styles.title}>Jackaroo</h1>

        {/* Name input — always visible */}
        <div className={styles.nameSection}>
          <label className={styles.label}>Your name</label>
          <input
            className={styles.input}
            type="text"
            placeholder="Enter your name…"
            maxLength={20}
            value={name}
            onChange={e => { setName(e.target.value); setError('') }}
            onKeyDown={e => e.key === 'Enter' && handleSolo()}
            autoFocus
          />
        </div>

        {/* Error — always occupies space so layout doesn't shift */}
        <p className={`${styles.error} ${error ? styles.errorVisible : ''}`}>
          {error || ' '}
        </p>

        {/* Single player */}
        <button
          className={styles.btnPrimary}
          onClick={handleSolo}
          disabled={loading || !trimName}
        >
          ▶ Play vs CPU
        </button>

        <div className={styles.divider}><span>or play with friends</span></div>

        {/* Multiplayer — always visible, no layout shift */}
        <div className={styles.multiRow}>
          <button
            className={styles.btnOutline}
            onClick={handleCreate}
            disabled={loading || !trimName}
          >
            {loading ? '…' : '+ Create Room'}
          </button>

          <div className={styles.joinRow}>
            <input
              className={styles.inputCode}
              type="text"
              placeholder="Room code"
              maxLength={6}
              value={code}
              onChange={e => { setCode(e.target.value.toUpperCase()); setError('') }}
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
            />
            <button
              className={styles.btnJoin}
              onClick={handleJoin}
              disabled={loading || !trimName || !trimCode}
            >
              Join →
            </button>
          </div>
        </div>

        <button className={styles.rulesLink} onClick={() => nav('/rules')}>
          How to play →
        </button>
      </div>
    </div>
  )
}
