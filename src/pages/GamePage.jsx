import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import * as api from '../api/gameApi'
import GameBoard from '../components/Board/GameBoard'
import PlayerHand from '../components/Cards/PlayerHand'
import styles from './GamePage.module.css'

const PLAYER_COLORS = {
  GREEN: '#27ae60', RED: '#e74c3c', YELLOW: '#f1c40f', BLUE: '#3498db',
}
const COLOUR_NAMES = {
  GREEN: 'Green', RED: 'Red', YELLOW: 'Yellow', BLUE: 'Blue',
}

// ── Sound engine ─────────────────────────────────────────────────────────────
let _audioCtx = null
function getAudioCtx() {
  if (!_audioCtx || _audioCtx.state === 'closed')
    _audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  return _audioCtx
}
function playSound(type) {
  try {
    const ctx = getAudioCtx()
    if (ctx.state === 'suspended') ctx.resume()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    const t = ctx.currentTime
    switch (type) {
      case 'card':
        osc.type = 'sine'
        osc.frequency.setValueAtTime(660, t)
        gain.gain.setValueAtTime(0.07, t)
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12)
        osc.start(t); osc.stop(t + 0.12)
        break
      case 'move':
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(340, t)
        osc.frequency.exponentialRampToValueAtTime(200, t + 0.18)
        gain.gain.setValueAtTime(0.1, t)
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22)
        osc.start(t); osc.stop(t + 0.22)
        break
      case 'trap':
        osc.type = 'sawtooth'
        osc.frequency.setValueAtTime(440, t)
        osc.frequency.exponentialRampToValueAtTime(80, t + 0.5)
        gain.gain.setValueAtTime(0.1, t)
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5)
        osc.start(t); osc.stop(t + 0.5)
        break
      case 'safe':
        osc.type = 'sine'
        osc.frequency.setValueAtTime(780, t)
        osc.frequency.exponentialRampToValueAtTime(1200, t + 0.25)
        gain.gain.setValueAtTime(0.09, t)
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35)
        osc.start(t); osc.stop(t + 0.35)
        break
      case 'win':
        osc.type = 'sine'
        ;[523, 659, 784, 1047].forEach((f, i) => osc.frequency.setValueAtTime(f, t + i * 0.16))
        gain.gain.setValueAtTime(0.15, t)
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.9)
        osc.start(t); osc.stop(t + 0.9)
        break
      case 'home':
        osc.type = 'sine'
        osc.frequency.setValueAtTime(300, t)
        osc.frequency.exponentialRampToValueAtTime(180, t + 0.25)
        gain.gain.setValueAtTime(0.08, t)
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25)
        osc.start(t); osc.stop(t + 0.25)
        break
    }
  } catch (_) { /* ignore audio errors */ }
}

// ── Card hint ─────────────────────────────────────────────────────────────────
function getCardHint(cardName) {
  if (!cardName) return null
  const base = cardName.split(' ')[0].toLowerCase()
  if (base === 'ace' || base === 'king')
    return { icon: '⚡', text: 'Click Play to field a marble from home, or click a home marble slot, or select a marble on the board to move it.' }
  if (base === 'ten')
    return { icon: '🎯', text: 'Click Play to force the next player to discard a card, or click your marble to move 10.' }
  if (base === 'queen')
    return { icon: '👑', text: 'Click Play to make a random player discard a card, or click your marble to move 12.' }
  if (base === 'jack')
    return { icon: '🔄', text: 'Click your marble + an opponent\'s to swap them, or just yours to move 11.' }
  if (base === 'seven')
    return { icon: '✂️', text: 'Click 1 marble to move all 7, or click 2 marbles to split. Adjust split with the slider.' }
  if (base === 'four')
    return { icon: '⬅️', text: 'Click your marble — it will move 4 steps backward.' }
  if (base === 'marbleburner')
    return { icon: '🔥', text: 'Click an opponent\'s marble on the board to send it back home.' }
  if (base === 'marblesaver')
    return { icon: '⭐', text: 'Click your own marble to instantly send it to a safe zone slot.' }
  if (base === 'five')
    return { icon: '5️⃣', text: 'Click any marble (yours or an opponent\'s) to move it 5 steps forward.' }
  return { icon: '▶️', text: 'Click your marble on the board to select it, then click Play.' }
}

let toastCounter = 0

export default function GamePage() {
  const nav = useNavigate()
  const location = useLocation()

  // ── Core state ────────────────────────────────────────────────────────────
  const [playerName, setPlayerName]   = useState(location.state?.playerName ?? '')
  const [gameState, setGameState]     = useState(null)
  const [gameStarted, setGameStarted] = useState(false)
  const [selectedCard, setSelectedCard] = useState(null)
  const [hasPlayed, setHasPlayed]     = useState(false)
  const [status, setStatus]           = useState('')
  const [error, setError]             = useState('')
  const [loading, setLoading]         = useState(false)

  // ── Notification state ────────────────────────────────────────────────────
  const [toasts, setToasts]           = useState([])
  const [flashColours, setFlashColours] = useState([])
  const [sparkleColours, setSparkleColours] = useState([])
  const [lastMovedCells, setLastMovedCells] = useState([])
  const [cpuThinking, setCpuThinking] = useState(null)

  // ── Feature state ─────────────────────────────────────────────────────────
  const [splitDistance, setSplitDistanceState] = useState(3)
  const [gameLog, setGameLog]         = useState([])
  const [showLog, setShowLog]         = useState(false)
  const [colorBlind, setColorBlind]   = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [confirmQuit, setConfirmQuit] = useState(false)
  const [confirmPass, setConfirmPass] = useState(false)

  // ── Refs ──────────────────────────────────────────────────────────────────
  const humanName      = useRef('')
  const prevStateRef   = useRef(null)
  const soundEnabledRef = useRef(true)
  const splitTimeoutRef = useRef(null)

  // Keep sound ref in sync so closures get fresh value
  useEffect(() => { soundEnabledRef.current = soundEnabled }, [soundEnabled])

  // ── Helpers ───────────────────────────────────────────────────────────────
  function sound(type) {
    if (soundEnabledRef.current) playSound(type)
  }

  function addToast(msg, type = 'info') {
    const id = ++toastCounter
    setToasts(t => [...t, { id, msg, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500)
  }

  function addLog(text, type = 'info') {
    const entry = { text, type, time: new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) }
    setGameLog(g => [entry, ...g].slice(0, 40))
  }

  // ── State processing ──────────────────────────────────────────────────────
  function detectEvents(prev, next) {
    if (!prev || !next) return

    // Marble sent home (homeCount increased)
    if (prev.players && next.players) {
      const prevMap = Object.fromEntries(prev.players.map(p => [p.colour, p.homeCount]))
      const affected = []
      next.players.forEach(p => {
        const diff = p.homeCount - (prevMap[p.colour] ?? 0)
        if (diff > 0) {
          affected.push(p.colour)
        }
      })
      if (affected.length) {
        setFlashColours(affected)
        setTimeout(() => setFlashColours([]), 1800)
      }
    }

    // Backend events (trap, safe, field, home captures)
    if (next.events?.length) {
      const safeAdded = []
      next.events.forEach(event => {
        const [type, colour] = event.split(':')
        const name = next.players?.find(p => p.colour === colour)?.name ?? COLOUR_NAMES[colour] ?? colour

        if (type === 'TRAP') {
          const isMe = colour === next.players?.find(p => p.human)?.colour
          addToast(isMe ? `⚠️ Your marble hit a trap!` : `${name}'s marble hit a trap!`, isMe ? 'danger' : 'warning')
          addLog(isMe ? 'Your marble hit a trap!' : `${name}'s marble hit a trap!`, 'danger')
          sound('trap')
        } else if (type === 'HOME') {
          const isMe = colour === next.players?.find(p => p.human)?.colour
          // Only show if it wasn't already covered by TRAP event
          const wasTrapped = next.events.some(e => e.startsWith('TRAP:' + colour))
          if (!wasTrapped) {
            addToast(isMe ? '💥 Your marble was captured!' : `${name}'s marble was captured.`, isMe ? 'danger' : 'neutral')
            addLog(isMe ? 'Your marble was captured!' : `${name}'s marble was captured.`, 'danger')
            sound('home')
          }
        } else if (type === 'SAFE') {
          const isMe = colour === next.players?.find(p => p.human)?.colour
          addToast(isMe ? '⭐ Your marble reached the Safe Zone!' : `${name}'s marble in Safe Zone.`, isMe ? 'success' : 'neutral')
          addLog(isMe ? 'Your marble entered the Safe Zone!' : `${name}'s marble entered Safe Zone.`, 'success')
          safeAdded.push(colour)
          sound('safe')
        } else if (type === 'FIELD') {
          const isMe = colour === next.players?.find(p => p.human)?.colour
          if (isMe) {
            addLog('You fielded a marble.', 'info')
          }
        }
      })
      if (safeAdded.length) {
        setSparkleColours(safeAdded)
        setTimeout(() => setSparkleColours([]), 1500)
      }
    }

    // Last moved marble detection — track cells that went from empty to occupied
    const newlyOccupied = []
    if (prev.track && next.track) {
      next.track.forEach((cell, i) => {
        if (cell?.marbleColour && !prev.track[i]?.marbleColour) newlyOccupied.push(i)
      })
    }
    if (newlyOccupied.length) {
      setLastMovedCells(newlyOccupied)
      setTimeout(() => setLastMovedCells([]), 2500)
    }
  }

  const applyState = useCallback((s) => {
    if (!s) return
    detectEvents(prevStateRef.current, s)
    prevStateRef.current = s
    setGameState(s)
  }, [])

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    if (!gameStarted) return
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      const isMyTurn = gameState?.currentPlayerName === humanName.current

      if (e.key === 'Escape') {
        if (confirmQuit) { setConfirmQuit(false); return }
        if (selectedCard !== null && !hasPlayed) {
          api.deselect().then(s => { applyState(s); setSelectedCard(null) }).catch(() => {})
        }
      }
      if (!isMyTurn || loading || hasPlayed) return
      const cards = gameState?.cardNames ?? []
      if (e.key >= '1' && e.key <= '4') {
        const idx = parseInt(e.key) - 1
        if (idx < cards.length) handleSelectCard(idx)
      }
      if ((e.key === 'f' || e.key === 'F') && selectedCard !== null) {
        const base = gameState?.selectedCardName?.split(' ')[0]?.toLowerCase()
        if (base === 'ace' || base === 'king') handlePlay()
      }
      if (e.key === 'Enter' && selectedCard !== null && !hasPlayed) {
        handlePlay()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [gameStarted, gameState, selectedCard, hasPlayed, loading, confirmQuit])

  // ── Split distance debounce ────────────────────────────────────────────────
  function handleSplitChange(val) {
    setSplitDistanceState(val)
    clearTimeout(splitTimeoutRef.current)
    splitTimeoutRef.current = setTimeout(() => {
      api.setSplitDistance(val).catch(() => {})
    }, 250)
  }

  // ── Game actions ──────────────────────────────────────────────────────────
  const handleStart = () => {
    const name = playerName.trim()
    if (!name || loading) return
    setLoading(true)
    setError('')
    api.startGame(name)
      .then(s => {
        humanName.current = name
        prevStateRef.current = s
        applyState(s)
        setGameStarted(true)
        setStatus('Game started — select a card from your hand.')
        addLog('Game started. Good luck!', 'info')
      })
      .catch(e => {
        const msg = e?.response?.data?.message || e.message || 'Could not connect to backend.'
        setError(msg)
      })
      .finally(() => setLoading(false))
  }

  const handleSelectCard = (idx) => {
    if (loading || hasPlayed) return
    setLoading(true)
    setError('')
    const action = selectedCard === idx
      ? api.deselect().then(s => { applyState(s); setSelectedCard(null); setStatus('Card deselected.') })
      : api.selectCard(idx).then(s => { applyState(s); setSelectedCard(idx); setStatus('Card selected.'); sound('card') })
    action.catch(e => {
      const msg = e?.response?.data?.message || e.message || 'Error selecting card.'
      setError(msg); addToast(msg, 'danger')
    }).finally(() => setLoading(false))
  }

  const handleSelectMarble = (marbleIdx) => {
    if (loading || hasPlayed) return
    setLoading(true)
    setError('')
    api.selectMarble(marbleIdx)
      .then(s => { applyState(s); setStatus('Marble selected — click Play to execute.') })
      .catch(e => {
        const msg = e?.response?.data?.message || e.message || 'Cannot select that marble.'
        setError(msg); addToast(msg, 'danger')
      })
      .finally(() => setLoading(false))
  }

  const handlePlay = () => {
    if (loading || selectedCard === null || hasPlayed) return
    setLoading(true)
    setError('')
    const cardName = gameState?.selectedCardName ?? 'a card'
    api.play()
      .then(s => {
        applyState(s)
        setHasPlayed(true)
        setStatus('Move executed! Click End Turn to finish.')
        sound('move')
        addLog(`You played ${cardName}.`, 'info')
      })
      .catch(e => {
        const msg = e?.response?.data?.message || e.message || 'Move failed.'
        setError(msg)
        addToast(msg, 'danger')
        // Refresh state so the marble toggle is reflected visually (backend may have deselected marble)
        api.getState().then(s => applyState(s)).catch(() => {})
      })
      .finally(() => setLoading(false))
  }

  const handleEndTurn = async (force = false) => {
    if (loading) return
    // If the player hasn't made a move and still has cards, require explicit confirmation
    if (!force && !hasPlayed && cards.length > 0 && selectedCard !== null) {
      setConfirmPass(true)
      return
    }
    if (!force && !hasPlayed && cards.length > 0 && selectedCard === null) {
      // No card selected + no play = nothing to discard, should not be reachable normally
      return
    }
    setConfirmPass(false)
    setLoading(true)
    setError('')
    try {
      let s = await api.endTurn()
      applyState(s)
      setSelectedCard(null)
      setHasPlayed(false)
      setSplitDistanceState(3)

      // Step through CPU turns with animated delay
      while (!s.winner && s.currentPlayerName !== humanName.current) {
        setCpuThinking(s.currentPlayerName)
        setStatus(`${s.currentPlayerName} is thinking…`)
        await new Promise(r => setTimeout(r, 900))
        try {
          s = await api.cpuStep()
          applyState(s)
          addLog(`${s.currentPlayerName !== humanName.current ? s.currentPlayerName : 'CPU'} took their turn.`, 'cpu')
        } catch {
          // Recover from network error — get current state without advancing
          try { s = await api.getState(); applyState(s) } catch {}
          break
        }
      }

      setCpuThinking(null)
      if (s.winner) {
        sound('win')
        addLog(`Game over! ${s.winner === humanName.current ? 'You win!' : s.winner + ' wins!'}`, 'win')
        setStatus('')
      } else {
        setStatus('Your turn!')
        addLog('Your turn.', 'info')
      }
    } catch (e) {
      const msg = e?.response?.data?.message || e.message || 'Error ending turn.'
      setError(msg)
      addToast(msg, 'danger')
      setCpuThinking(null)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setGameState(null)
    setGameStarted(false)
    setPlayerName('')
    setSelectedCard(null)
    setHasPlayed(false)
    setStatus('')
    setError('')
    setToasts([])
    setGameLog([])
    setSplitDistanceState(3)
    setCpuThinking(null)
    setConfirmQuit(false)
    setConfirmPass(false)
    prevStateRef.current = null
  }

  const handleRestartGame = () => {
    setLoading(true)
    api.restart()
      .then(s => {
        prevStateRef.current = s
        applyState(s)
        setSelectedCard(null)
        setHasPlayed(false)
        setSplitDistanceState(3)
        setGameLog([])
        setStatus('New game started — select a card.')
        addLog('Game restarted.', 'info')
      })
      .catch(e => {
        const msg = e?.response?.data?.message || e.message || 'Restart failed.'
        setError(msg); addToast(msg, 'danger')
      })
      .finally(() => setLoading(false))
  }

  // ── Derived values ─────────────────────────────────────────────────────────
  const isMyTurn       = gameState?.currentPlayerName === humanName.current
  const cards          = gameState?.cardNames ?? []
  const cardDescs      = gameState?.cardDescriptions ?? []
  const colour         = gameState?.currentPlayerColour
  const playerHex      = PLAYER_COLORS[colour] ?? '#c9a84c'
  const selectedCardName = gameState?.selectedCardName
  const hint           = getCardHint(selectedCardName)
  const isSevenSelected = selectedCardName?.toLowerCase().startsWith('seven')
  const canField       = isMyTurn && !hasPlayed && !loading &&
    (selectedCardName?.toLowerCase().startsWith('ace') || selectedCardName?.toLowerCase().startsWith('king'))
  const humanPlayer    = gameState?.players?.find(p => p.human)
  const humanHomeCount = humanPlayer?.homeCount ?? 0

  const safeCount = (col) =>
    gameState?.safeZones?.find(sz => sz.ownerColour === col)?.cells?.filter(c => c.marbleColour)?.length ?? 0

  const nextPlayerHex = PLAYER_COLORS[gameState?.nextPlayerColour] ?? '#888'

  // ── Pre-game screen ────────────────────────────────────────────────────────
  if (!gameStarted) {
    return (
      <div className={styles.centeredScreen}>
        <div className={styles.startCard}>
          <div className={styles.startSuits}>♦ ♠ ♣ ♥</div>
          <h1>New Game</h1>
          <p>You'll play against 3 CPU opponents. Make sure the backend is running on port 8080.</p>
          <div className={styles.startForm}>
            <input
              type="text" value={playerName}
              onChange={e => setPlayerName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleStart()}
              placeholder="Enter your name…" maxLength={20}
              className={styles.nameInput} autoFocus
            />
            <button onClick={handleStart} disabled={loading || !playerName.trim()} className={styles.startBtn}>
              {loading ? 'Starting…' : 'Start Game'}
            </button>
          </div>
          {error && <p className={styles.errorMsg}>{error}</p>}
          <button className={styles.rulesLink} onClick={() => nav('/rules')}>Read the rules first →</button>
        </div>
      </div>
    )
  }

  // ── Winner screen ──────────────────────────────────────────────────────────
  if (gameState?.winner) {
    const won = gameState.winner === humanName.current
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
            <button onClick={handleRestartGame} className={styles.startBtn}>Play Again</button>
            <button onClick={handleReset} className={styles.quitBtn} style={{ fontSize: '0.9rem', padding: '0.6rem 1.2rem' }}>Main Menu</button>
          </div>
        </div>
      </div>
    )
  }

  // ── Main game ──────────────────────────────────────────────────────────────
  return (
    <div className={styles.gamePage}>

      {/* ── Toast notifications ── */}
      <div className={styles.toastContainer}>
        {toasts.map(t => (
          <div key={t.id} className={`${styles.toast} ${styles[`toast${t.type.charAt(0).toUpperCase() + t.type.slice(1)}`]}`}>
            {t.msg}
          </div>
        ))}
      </div>

      {/* ── Confirm quit dialog ── */}
      {confirmQuit && (
        <div className={styles.dialogOverlay}>
          <div className={styles.dialog}>
            <h3>Quit game?</h3>
            <p>Your progress will be lost.</p>
            <div className={styles.dialogBtns}>
              <button onClick={handleReset} className={styles.dialogDanger}>Quit</button>
              <button onClick={() => setConfirmQuit(false)} className={styles.dialogCancel}>Stay</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm pass (discard card without playing) ── */}
      {confirmPass && (
        <div className={styles.dialogOverlay}>
          <div className={styles.dialog}>
            <h3>Pass your turn?</h3>
            <p>
              This will discard <strong>{gameState?.selectedCardName ?? 'your selected card'}</strong> without making a move.
              Only do this if no valid move exists.
            </p>
            <div className={styles.dialogBtns}>
              <button onClick={() => handleEndTurn(true)} className={styles.dialogDanger}>Discard &amp; Pass</button>
              <button onClick={() => setConfirmPass(false)} className={styles.dialogCancel}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Board ── */}
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

      {/* ── Sidebar ── */}
      <aside className={styles.sidebar}>

        {/* Turn badge */}
        <div className={styles.turnBadge} style={{ '--pc': playerHex }}>
          <div className={styles.colorDot} />
          <div className={styles.turnInfo}>
            <span className={styles.turnLabel}>{isMyTurn ? 'Your Turn' : cpuThinking ? 'CPU Thinking' : "CPU's Turn"}</span>
            <span className={styles.turnPlayer}>{gameState?.currentPlayerName}</span>
          </div>
          <div className={styles.turnMeta}>
            <span className={styles.colourTag}>{colour}</span>
            <span className={styles.roundTag}>R{gameState?.roundCount ?? 1}</span>
          </div>
        </div>

        {/* Next up */}
        {gameState?.nextPlayerName && (
          <div className={styles.nextUp} style={{ '--nc': nextPlayerHex }}>
            <span className={styles.nextLabel}>Next up:</span>
            <div className={styles.nextDot} />
            <span className={styles.nextName}>{gameState.nextPlayerName}</span>
          </div>
        )}

        {/* CPU thinking */}
        {cpuThinking && (
          <div className={styles.cpuBox}>
            <div className={styles.spinnerRing} />
            <p>{cpuThinking} is thinking…</p>
          </div>
        )}

        {isMyTurn && !cpuThinking && (
          <>
            {/* Hand */}
            <section className={styles.sideSection}>
              <h3 className={styles.sideTitle}>Your Hand</h3>
              <PlayerHand
                cards={cards}
                selectedCard={hasPlayed ? null : selectedCard}
                onSelectCard={hasPlayed || loading ? undefined : handleSelectCard}
                disabled={loading || hasPlayed}
                descriptions={cardDescs}
              />
            </section>

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
                  <div className={styles.cardHintName}>{selectedCardName}</div>
                  <p className={styles.cardHintText}>{hint.text}</p>
                  {(selectedCardName?.toLowerCase().startsWith('ace') || selectedCardName?.toLowerCase().startsWith('king')) && (
                    <p className={styles.cardHintSub}>⌨ Press <kbd>F</kbd> or <kbd>Enter</kbd> to field</p>
                  )}
                </div>
              </div>
            )}

            {hasPlayed && (
              <div className={styles.playedBanner}>
                ✓ Move executed — click <strong>End Turn</strong> to finish.
              </div>
            )}

            {!selectedCard && !hasPlayed && cards.length > 0 && (
              <p className={styles.sideHint}>← Select a card. Keys: <kbd>1</kbd>–<kbd>4</kbd>, <kbd>Esc</kbd> to deselect.</p>
            )}

            {cards.length === 0 && !hasPlayed && (
              <div className={styles.cardHint}>
                <span className={styles.cardHintIcon}>⚠️</span>
                <div>
                  <div className={styles.cardHintName}>Hand Discarded</div>
                  <p className={styles.cardHintText}>An opponent forced your cards away. Click End Turn to pass.</p>
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
                  {loading ? '…' : canField && !hasPlayed ? '⚡ Field / Play' : 'Play Card'}
                </button>
                <button
                  onClick={() => handleEndTurn(false)}
                  disabled={loading || (!hasPlayed && cards.length > 0 && selectedCard === null)}
                  title={!hasPlayed && selectedCard !== null ? 'No valid move? This will discard your card.' : undefined}
                  className={`${styles.endBtn} ${hasPlayed ? styles.endBtnReady : ''} ${!hasPlayed && selectedCard !== null ? styles.endBtnPass : ''}`}
                >
                  {!hasPlayed && selectedCard !== null ? 'Pass Turn' : 'End Turn'}
                </button>
              </div>
            </section>
          </>
        )}

        {status && !cpuThinking && <p className={styles.statusMsg}>{status}</p>}
        {error  && <p className={styles.errorMsg}>{error}</p>}

        {/* Players list with progress */}
        <section className={styles.sideSection}>
          <h3 className={styles.sideTitle}>Players</h3>
          <div className={styles.playerList}>
            {gameState?.players?.map(p => {
              const hex    = PLAYER_COLORS[p.colour] ?? '#888'
              const inSafe = safeCount(p.colour)
              const onTrack = 4 - p.homeCount - inSafe
              const progress = inSafe / 4
              return (
                <div
                  key={p.colour}
                  className={`${styles.playerRow} ${p.current ? styles.playerRowActive : ''}`}
                  style={{ '--pc': hex }}
                >
                  <div className={styles.playerDot} />
                  <div className={styles.playerInfo}>
                    <div className={styles.playerName}>
                      {p.name}{!p.human && <span className={styles.cpuTag}> CPU</span>}
                    </div>
                    <div className={styles.playerMarbles}>
                      <span title="In home zone">🏠 {p.homeCount}</span>
                      {onTrack > 0 && <span title="On track"> · ●{onTrack}</span>}
                      {inSafe > 0 && <span title="In safe zone" style={{ color: '#c9a84c' }}> · ★{inSafe}</span>}
                      {!p.human && <span title="Cards in hand" style={{ color: 'var(--text-dim)' }}> · 🃏{p.handSize}</span>}
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

        {/* Deck / Fire pit info */}
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
          <span>Playing as <strong>{humanName.current}</strong></span>
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
            <button onClick={handleRestartGame} className={styles.restartBtn} title="Restart game" disabled={loading}>↺</button>
            <button onClick={() => setConfirmQuit(true)} className={styles.quitBtn}>Quit</button>
          </div>
        </div>
      </aside>
    </div>
  )
}
