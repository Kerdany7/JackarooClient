import styles from './GameCard.module.css'

const RANK_MAP = {
  Ace: 'A', Two: '2', Three: '3', Four: '4', Five: '5', Six: '6',
  Seven: '7', Eight: '8', Nine: '9', Ten: '10', Jack: 'J', Queen: 'Q', King: 'K',
}
const SUIT_MAP = { SPADE: '♠', CLUB: '♣', DIAMOND: '♦', HEART: '♥' }
const RED_SUITS = new Set(['♦', '♥'])

function parseCard(name) {
  if (!name) return { rank: '?', suit: '', textColor: 'var(--text)', isWild: false }

  if (/burner/i.test(name)) return { rank: '🔥', suit: '', textColor: '#ff7043', label: 'Marble Burner', isWild: true, wildColor: '#7c2d12' }
  if (/saver/i.test(name)) return { rank: '⭐', suit: '', textColor: '#a855f7', label: 'Marble Saver', isWild: true, wildColor: '#3b0764' }

  // Parse "RankName of SUIT" or "RankName_SUIT" or just "RankName"
  const parts = name.trim().split(/\s+of\s+|\s+|_/i)
  const rankSym = RANK_MAP[parts[0]] ?? parts[0]
  const suitSym = SUIT_MAP[parts[parts.length - 1]?.toUpperCase()] ?? ''
  const isRed = RED_SUITS.has(suitSym)

  return { rank: rankSym, suit: suitSym, textColor: isRed ? '#e55' : 'var(--text)', isWild: false }
}

export default function GameCard({ name, description, selected, onClick, disabled }) {
  const card = parseCard(name)

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={description || name}
      className={[
        styles.card,
        selected ? styles.selected : '',
        card.isWild ? styles.wild : '',
        disabled ? styles.disabled : '',
      ].join(' ')}
    >
      {card.isWild ? (
        <div className={styles.wildContent} style={{ color: card.textColor }}>
          <div className={styles.wildEmoji}>{card.rank}</div>
          <div className={styles.wildLabel}>{card.label}</div>
        </div>
      ) : (
        <>
          <div className={styles.corner} style={{ color: card.textColor }}>
            <span className={styles.rank}>{card.rank}</span>
            <span className={styles.suit}>{card.suit}</span>
          </div>
          <div className={styles.centerSuit} style={{ color: card.textColor }}>
            {card.suit}
          </div>
          <div className={`${styles.corner} ${styles.flipped}`} style={{ color: card.textColor }}>
            <span className={styles.rank}>{card.rank}</span>
            <span className={styles.suit}>{card.suit}</span>
          </div>
        </>
      )}
    </button>
  )
}
