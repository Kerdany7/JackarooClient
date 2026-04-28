import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import * as api from '../api/gameApi'
import GameBoard from '../components/Board/GameBoard'
import PlayerHand from '../components/Cards/PlayerHand'
import { playSound } from '../utils/sounds'
import { getCardHint } from '../utils/cardHints'
import styles from './GamePage.module.css'  // reuse solo game styles

const PLAYER_COLORS = { GREEN: '#27ae60', RED: '#e74c3c', YELLOW: '#f1c40f', BLUE: '#3498db' }
const COLOUR_NAMES  = { GREEN: 'Green', RED: 'Red', YELLOW: 'Yellow', BLUE: 'Blue' }

let toastCounter = 0

export default function MultiGamePage() {
  const { roomCode } = useParams()
  const location     = useLocation()
  const nav          = useNavigate()
  const sessionRef   = useRef(location.state) // { token, myName }

  // ── Core state ──────────────────────────────────────────────────────────────
  const [gameState, setGameState]   = useState(null)
  const [selectedCard, setSelectedCard] = useState(null)
  const [hasPlayed, setHasPlayed]   = useState(false)
  const [status, setStatus]         = useState('')
  const [error, setError]           = useState('')
  const [loading, setLoading]       = useState(false)

  // ── Notification state ───────────────────────────────────────────────────────
  const [toasts, setToasts]             = useState([])
  const [flashColours, setFlashColours] = useState([])
  const [sparkleColours, setSparkleColours] = useState([])
  const [lastMovedCells, setLastMovedCells] = useState([])

  // ── Feature state ────────────────────────────────────────────────────────────
  const [splitDistance, setSplitDistanceState] = useState(3)
  const [gameLog, setGameLog]   = useState([])
  const [showLog, setShowLog]   = useState(false)
  const [colorBlind, setColorBlind] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [confirmPass, setConfirmPass]   = useState(false)

  // ── Refs ─────────────────────────────────────────────────────────────────────
  const prevStateRef    = useRef(null)
  const soundEnabledRef = useRef(true)
  const splitTimeoutRef = useRef(null)
  const pollRef         = useRef(null)

  const session = sessionRef.current

  // Redirect if no session
  useEffect(() => {
    if (!session?.token) nav('/lobby', { replace: true })
  }, [])

  useEffect(() => { soundEnabledRef.current = soundEnabled }, [soundEnabled])

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const sound = (type) => { if (soundEnabledRef.current) playSound(type) }

  function addToast(msg, type = 'info') {
    const id = ++toastCounter
    setToasts(t => [...t, { id, msg, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500)
  }

  function addLog(text, type = 'info') {
    const entry = {
      text, type,
      time: new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    }
    setGameLog(g => [entry, ...g].slice(0, 40))
  }

  // ── State processing ──────────────────────────────────────────────────────────
  function detectEvents(prev, next) {
    if (!prev || !next) return

    if (prev.players && next.players) {
      const prevMap = Object.fromEntries(prev.players.map(p => [p.colour, p.homeCount]))
      const affected = []
      next.players.forEach(p => {
        if ((p.homeCount - (prevMap[p.colour] ?? 0)) > 0) affected.push(p.colour)
      })
      if (affected.length) {
        setFlashColours(affected)
        setTimeout(() => setFlashColours([]), 1800)
      }
    }

    if (next.events?.length) {
      const safeAdded = []
      next.events.forEach(event => {
        const [type, colour] = event.split(':')
        const myColour = next.myColour
        const name = next.players?.find(p => p.colour === colour)?.name ?? COLOUR_NAMES[colour] ?? colour
        const isMe = colour === myColour

        if (type === 'TRAP') {
          addToast(isMe ? '⚠️ Your marble hit a trap!' : `${name}'s marble hit a trap!`, isMe ? 'danger' : 'warning')
          addLog(isMe ? 'Your marble hit a trap!' : `${name}'s marble hit a trap!`, 'danger')
          sound('trap')
        } else if (type === 'HOME') {
          const wasTrapped = next.events.some(e => e.startsWith('TRAP:' + colour))
          if (!wasTrapped) {
            addToast(isMe ? '💥 Your marble was captured!' : `${name}'s marble was captured.`, isMe ? 'danger' : 'neutral')
            addLog(isMe ? 'Your marble was captured!' : `${name}'s marble was captured.`, 'danger')
            sound('home')
          }
        } else if (type === 'SAFE') {
          addToast(isMe ? '⭐ Your marble reached the Safe Zone!' : `${name}'s marble in Safe Zone.`, isMe ? 'success' : 'neutral')
          addLog(isMe ? 'Your marble entered the Safe Zone!' : `${name}'s marble entered Safe Zone.`, 'success')
          safeAdded.push(colour)
          sound('safe')
        }
      })
      if (safeAdded.length) {
        setSparkleColours(safeAdded)
        setTimeout(() => setSparkleColours([]), 1500)
      }
    }

    if (prev.track && next.track) {
      const newlyOccupied = []
      next.track.forEach((cell, i) => {
        if (cell?.marbleColour && !prev.track[i]?.marbleColour) newlyOccupied.push(i)
      })
      if (newlyOccupied.length) {
        setLastMovedCells(newlyOccupied)
        setTimeout(() => setLastMovedCells([]), 2500)
      }
    }
  }

  const applyState = useCallback((s) => {
    if (!s) return
    const prev = prevStateRef.current
    prevStateRef.current = s
    detectEvents(prev, s)

    // If it's now my turn but wasn't before → reset play state
    const wasMyTurn = prev?.myTurn
    if (!wasMyTurn && s.myTurn) {
      setSelectedCard(null)
      setHasPlayed(false)
      setSplitDistanceState(3)
      setStatus('Your turn!')
      addLog('Your turn.', 'info')
    }

    setGameState(s)

    if (s.winner) {
      sound('win')
      const isMe = s.winner === session?.myName
      addLog(`Game over! ${isMe ? 'You win!' : s.winner + ' wins!'}`, 'win')
    }
  }, [session])

  // ── Polling (when not my turn) ────────────────────────────────────────────────
  const startPolling = useCallback(() => {
    if (pollRef.current) return
    pollRef.current = setInterval(() => {
      api.roomGetState(roomCode, session.token)
        .then(s => applyState(s))
        .catch(() => {})
    }, 2000)
  }, [roomCode, session, applyState])

  const stopPolling = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
  }, [])

  // Start or stop polling based on turn
  useEffect(() => {
    if (!gameState) return
    if (gameState.myTurn && !gameState.winner) {
      stopPolling()
    } else if (!gameState.winner) {
      startPolling()
    }
    return () => {}
  }, [gameState?.myTurn, gameState?.winner])

  // Cleanup polling on unmount
  useEffect(() => () => stopPolling(), [])

  // ── Heartbeat every 10 seconds ────────────────────────────────────────────────
  useEffect(() => {
    if (!session?.token) return
    const hb = setInterval(() => api.heartbeat(roomCode, session.token), 10000)
    return () => clearInterval(hb)
  }, [roomCode])

  // ── Initial state fetch ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!session?.token) return
    api.roomGetState(roomCode, session.token)
      .then(s => {
        applyState(s)
        if (!s.myTurn) startPolling()
      })
      .catch(e => {
        const msg = e?.response?.data?.message || 'Could not load game state.'
        setError(msg)
      })
  }, [roomCode])

  // ── Split distance debounce ───────────────────────────────────────────────────
  function handleSplitChange(val) {
    setSplitDistanceState(val)
    clearTimeout(splitTimeoutRef.current)
    splitTimeoutRef.current = setTimeout(() => {
      api.roomSetSplitDistance(roomCode, session.token, val).catch(() => {})
    }, 250)
  }

  // ── Game actions ──────────────────────────────────────────────────────────────
  const handleSelectCard = (idx) => {
    if (loading || hasPlayed) return
    setLoading(true); setError('')
    const action = selectedCard === idx
      ? api.roomDeselect(roomCode, session.token)
          .then(s => { applyState(s); setSelectedCard(null); setStatus('Card deselected.') })
      : api.roomSelectCard(roomCode, session.token, idx)
          .then(s => { applyState(s); setSelectedCard(idx); setStatus('Card selected.'); sound('card') })
    action
      .catch(e => {
        const msg = e?.response?.data?.message || e.message || 'Error selecting card.'
        setError(msg); addToast(msg, 'danger')
      })
      .finally(() => setLoading(false))
  }

  const handleSelectMarble = (marbleIdx) => {
    if (loading || hasPlayed) return
    setLoading(true); setError('')
    api.roomSelectMarble(roomCode, session.token, marbleIdx)
      .then(s => { applyState(s); setStatus('Marble selected — click Play to execute.') })
      .catch(e => {
        const msg = e?.response?.data?.message || e.message || 'Cannot select that marble.'
        setError(msg); addToast(msg, 'danger')
      })
      .finally(() => setLoading(false))
  }

  const handlePlay = () => {
    if (loading || selectedCard === null || hasPlayed) return
    setLoading(true); setError('')
    const cardName = gameState?.mySelectedCardName ?? 'a card'
    api.roomPlay(roomCode, session.token)
      .then(s => {
        applyState(s); setHasPlayed(true)
        setStatus('Move executed! Click End Turn to finish.')
        sound('move')
        addLog(`You played ${cardName}.`, 'info')
      })
      .catch(e => {
        const msg = e?.response?.data?.message || e.message || 'Move failed.'
        setError(msg); addToast(msg, 'danger')
        api.roomGetState(roomCode, session.token).then(s => applyState(s)).catch(() => {})
      })
      .finally(() => setLoading(false))
  }

  const handleEndTurn = (force = false) => {
    if (loading) return
    const myCards = gameState?.myCardNames ?? []
    if (!force && !hasPlayed && myCards.length > 0 && selectedCard !== null) {
      setConfirmPass(true); return
    }
    if (!force && !hasPlayed && myCards.length > 0 && selectedCard === null) return
    setConfirmPass(false); setLoading(true); setError('')
    api.roomEndTurn(roomCode, session.token)
      .then(s => {
        applyState(s)
        setSelectedCard(null); setHasPlayed(false); setSplitDistanceState(3)
        if (!s.myTurn) {
          setStatus(`Waiting for ${s.currentPlayerName}…`)
          startPolling()
        }
      })
      .catch(e => {
        const msg = e?.response?.data?.message || e.message || 'Error ending turn.'
        setError(msg); addToast(msg, 'danger')
      })
      .finally(() => setLoading(false))
  }

  const handleLeave = () => {
    api.leaveRoom(roomCode, session.token).catch(() => {})
    nav('/lobby', { replace: true })
  }

  // ── Derived values ────────────────────────────────────────────────────────────
  const isMyTurn     = gameState?.myTurn ?? false
  const myColour     = gameState?.myColour
  const myHex        = PLAYER_COLORS[myColour] ?? '#c9a84c'
  const myCards      = gameState?.myCardNames ?? []
  const myCardDescs  = gameState?.myCardDescriptions ?? []
  const mySelCard    = gameState?.mySelectedCardName
  const hint         = getCardHint(mySelCard)
  const isSevenSelected = mySelCard?.toLowerCase().startsWith('seven')
  const canField     = isMyTurn && !hasPlayed && !loading &&
    (mySelCard?.toLowerCase().startsWith('ace') || mySelCard?.toLowerCase().startsWith('king'))

  const activeHex    = PLAYER_COLORS[gameState?.currentPlayerColour] ?? '#888'
  const nextHex      = PLAYER_COLORS[gameState?.nextPlayerColour] ?? '#888'

  const safeCount = (col) =>
    gameState?.safeZones?.find(sz => sz.ownerColour === col)?.cells?.filter(c => c.marbleColour)?.length ?? 0

  if (!session?.token) return null

  // ── Winner screen ──────────────────────────────────────────────────────────────
  if (gameState?.winner) {
    const won = gameState.winner === session.myName
    const winnerColour = gameState.players?.find(p => p.name === gameState.winner)?.colour
    const winnerHex = PLAYER_COLORS[winnerColour] ?? '#c9a84c'
    return (
      <div className={styles.centeredScreen}>
        <div className={styles.startCard}>
          <div className={styles.trophy}>{won ? '🏆' : '🎲'}</div>
          <h1>{won ? 'You Win!' : `${gameState.winner} Wins!`}</h1>
          {winnerColour && (
            <div className={styles.winnerBadge} style={{ '--wc': winnerHex }}>
              <div className={styles.winnerDot} />
              {COLOUR_NAMES[winnerColour] ?? winnerColour}
            </div>
          )}
          <p>{won ? 'Congratulations! All your marbles reached the Safe Zone.' : 'Better luck next time!'}</p>
          <div className={styles.winnerActions}>
            <button onClick={handleLeave} className={styles.startBtn}>Back to Lobby</button>
          </div>
        </div>
      </div>
    )
  }

  // ── Main game ──────────────────────────────────────────────────────────────────
  return (
    <div className={styles.gamePage}>

      {/* Toasts */}
      <div className={styles.toastContainer}>
        {toasts.map(t => (
          <div key={t.id} className={`${styles.toast} ${styles[`toast${t.type.charAt(0).toUpperCase() + t.type.slice(1)}`]}`}>
            {t.msg}
          </div>
        ))}
      </div>

      {/* Confirm pass */}
      {confirmPass && (
        <div className={styles.dialogOverlay}>
          <div className={styles.dialog}>
            <h3>Pass your turn?</h3>
            <p>This will discard <strong>{mySelCard ?? 'your card'}</strong> without making a move.</p>
            <div className={styles.dialogBtns}>
              <button onClick={() => handleEndTurn(true)} className={styles.dialogDanger}>Discard &amp; Pass</button>
              <button onClick={() => setConfirmPass(false)} className={styles.dialogCancel}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Board */}
      <div className={styles.boardArea}>
        <GameBoard
          gameState={gameState}
          flashColours={flashColours}
          sparkleColours={sparkleColours}
          lastMovedTrackIndices={lastMovedCells}
          colorBlind={colorBlind}
          canField={canField}
          onSelectMarble={isMyTurn && !hasPlayed && !loading ? handleSelectMarble : undefined}
          onFieldMarble={canField ? handlePlay : undefined}
        />
      </div>

      {/* Sidebar */}
      <aside className={styles.sidebar}>

        {/* Turn badge — show active player */}
        <div className={styles.turnBadge} style={{ '--pc': activeHex }}>
          <div className={styles.colorDot} />
          <div className={styles.turnInfo}>
            <span className={styles.turnLabel}>
              {isMyTurn ? 'Your Turn' : `${gameState?.currentPlayerName ?? '…'}'s Turn`}
            </span>
            <span className={styles.turnPlayer}>{gameState?.currentPlayerName}</span>
          </div>
          <div className={styles.turnMeta}>
            <span className={styles.colourTag}>{gameState?.currentPlayerColour}</span>
            <span className={styles.roundTag}>R{gameState?.roundCount ?? 1}</span>
          </div>
        </div>

        {/* Next up */}
        {gameState?.nextPlayerName && (
          <div className={styles.nextUp} style={{ '--nc': nextHex }}>
            <span className={styles.nextLabel}>Next up:</span>
            <div className={styles.nextDot} />
            <span className={styles.nextName}>{gameState.nextPlayerName}</span>
          </div>
        )}

        {/* Waiting overlay when not my turn */}
        {!isMyTurn && (
          <div className={styles.cpuBox}>
            <div className={styles.spinnerRing} />
            <p>Waiting for {gameState?.currentPlayerName ?? '…'}…</p>
          </div>
        )}

        {/* My hand — always visible */}
        <section className={styles.sideSection}>
          <h3 className={styles.sideTitle}>Your Hand {!isMyTurn && <span className={styles.cpuTag}>(not your turn)</span>}</h3>
          <PlayerHand
            cards={myCards}
            selectedCard={isMyTurn && !hasPlayed ? selectedCard : null}
            onSelectCard={isMyTurn && !hasPlayed && !loading ? handleSelectCard : undefined}
            disabled={!isMyTurn || loading || hasPlayed}
            descriptions={myCardDescs}
          />
        </section>

        {isMyTurn && (
          <>
            {/* Seven split slider */}
            {isSevenSelected && !hasPlayed && (
              <div className={styles.splitBox}>
                <div className={styles.splitHeader}>
                  <span>Split: <strong>{splitDistance}</strong> + <strong>{7 - splitDistance}</strong></span>
                </div>
                <input type="range" min={1} max={6} value={splitDistance}
                  onChange={e => handleSplitChange(Number(e.target.value))}
                  className={styles.splitSlider}
                />
                <div className={styles.splitLabels}><span>1+6</span><span>3+4</span><span>6+1</span></div>
              </div>
            )}

            {/* Card hint */}
            {hint && !hasPlayed && (
              <div className={styles.cardHint}>
                <span className={styles.cardHintIcon}>{hint.icon}</span>
                <div>
                  <div className={styles.cardHintName}>{mySelCard}</div>
                  <p className={styles.cardHintText}>{hint.text}</p>
                </div>
              </div>
            )}

            {hasPlayed && (
              <div className={styles.playedBanner}>
                ✓ Move executed — click <strong>End Turn</strong> to finish.
              </div>
            )}

            {!selectedCard && !hasPlayed && myCards.length > 0 && (
              <p className={styles.sideHint}>← Select a card to play.</p>
            )}

            {myCards.length === 0 && !hasPlayed && (
              <div className={styles.cardHint}>
                <span className={styles.cardHintIcon}>⚠️</span>
                <div>
                  <div className={styles.cardHintName}>Hand Discarded</div>
                  <p className={styles.cardHintText}>Your cards were discarded. Click End Turn to pass.</p>
                </div>
              </div>
            )}

            {/* Actions */}
            <section className={styles.sideSection}>
              <div className={styles.actionRow}>
                <button
                  onClick={handlePlay}
                  disabled={loading || selectedCard === null || hasPlayed}
                  className={`${styles.playBtn} ${canField && !hasPlayed ? styles.playBtnField : ''}`}
                >
                  {loading ? '…' : canField ? '⚡ Field / Play' : 'Play Card'}
                </button>
                <button
                  onClick={() => handleEndTurn(false)}
                  disabled={loading || (!hasPlayed && myCards.length > 0 && selectedCard === null)}
                  className={`${styles.endBtn} ${hasPlayed ? styles.endBtnReady : ''} ${!hasPlayed && selectedCard !== null ? styles.endBtnPass : ''}`}
                >
                  {!hasPlayed && selectedCard !== null ? 'Pass Turn' : 'End Turn'}
                </button>
              </div>
            </section>
          </>
        )}

        {status && <p className={styles.statusMsg}>{status}</p>}
        {error  && <p className={styles.errorMsg}>{error}</p>}

        {/* Players list */}
        <section className={styles.sideSection}>
          <h3 className={styles.sideTitle}>Players</h3>
          <div className={styles.playerList}>
            {gameState?.players?.map(p => {
              const hex    = PLAYER_COLORS[p.colour] ?? '#888'
              const inSafe = safeCount(p.colour)
              const onTrack = 4 - p.homeCount - inSafe
              const progress = inSafe / 4
              const isMe = p.colour === myColour
              return (
                <div
                  key={p.colour}
                  className={`${styles.playerRow} ${p.current ? styles.playerRowActive : ''}`}
                  style={{ '--pc': hex }}
                >
                  <div className={styles.playerDot} />
                  <div className={styles.playerInfo}>
                    <div className={styles.playerName}>
                      {p.name}
                      {isMe && <span className={styles.cpuTag}> (you)</span>}
                      {!p.human && <span className={styles.cpuTag}> CPU</span>}
                    </div>
                    <div className={styles.playerMarbles}>
                      <span title="In home zone">🏠 {p.homeCount}</span>
                      {onTrack > 0 && <span title="On track"> · ●{onTrack}</span>}
                      {inSafe > 0 && <span title="In safe zone" style={{ color: '#c9a84c' }}> · ★{inSafe}</span>}
                    </div>
                    <div className={styles.progressBar}>
                      <div className={styles.progressFill} style={{ width: `${progress * 100}%`, background: hex }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Deck info */}
        {gameState && (
          <div className={styles.deckInfo}>
            <span>🃏 Deck: {gameState.deckCount ?? '?'}</span>
            <span>🔥 Pit: {gameState.firePitCount ?? 0}
              {gameState.firePitTopCard && <span className={styles.firePitTop}> ({gameState.firePitTopCard})</span>}
            </span>
          </div>
        )}

        {/* Game log */}
        <section className={styles.sideSection}>
          <button className={styles.logToggle} onClick={() => setShowLog(v => !v)}>
            {showLog ? '▾' : '▸'} Game Log ({gameLog.length})
          </button>
          {showLog && (
            <div className={styles.logPanel}>
              {gameLog.length === 0 && <p className={styles.logEmpty}>No events yet.</p>}
              {gameLog.map((entry, i) => (
                <div key={i} className={`${styles.logEntry} ${styles[`log${entry.type.charAt(0).toUpperCase() + entry.type.slice(1)}`]}`}>
                  <span className={styles.logTime}>{entry.time}</span>
                  <span>{entry.text}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Meta row */}
        <div className={styles.metaRow}>
          <span>Playing as <strong>{session.myName}</strong></span>
          <div className={styles.metaActions}>
            <button
              onClick={() => setColorBlind(v => !v)}
              className={`${styles.iconBtn} ${colorBlind ? styles.iconBtnActive : ''}`}
              title="Toggle color-blind mode"
            >Aa</button>
            <button
              onClick={() => setSoundEnabled(v => !v)}
              className={`${styles.iconBtn} ${!soundEnabled ? styles.iconBtnMuted : ''}`}
              title={soundEnabled ? 'Mute sounds' : 'Enable sounds'}
            >{soundEnabled ? '🔊' : '🔇'}</button>
            <button onClick={handleLeave} className={styles.quitBtn}>Leave</button>
          </div>
        </div>

      </aside>
    </div>
  )
}
