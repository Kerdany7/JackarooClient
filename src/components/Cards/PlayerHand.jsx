import GameCard from './GameCard'
import styles from './PlayerHand.module.css'

export default function PlayerHand({ cards = [], selectedCard, onSelectCard, disabled, descriptions = [] }) {
  if (!cards.length) {
    return <p className={styles.empty}>No cards in hand</p>
  }
  return (
    <div className={styles.hand}>
      {cards.map((name, i) => (
        <GameCard
          key={i}
          name={name}
          description={descriptions[i]}
          selected={selectedCard === i}
          onClick={onSelectCard ? () => onSelectCard(i) : undefined}
          disabled={disabled || !onSelectCard}
        />
      ))}
    </div>
  )
}
