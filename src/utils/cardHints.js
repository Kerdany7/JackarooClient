export function getCardHint(cardName) {
  if (!cardName) return null
  const base = cardName.split(' ')[0].toLowerCase()
  if (base === 'ace' || base === 'king')
    return { icon: '⚡', text: 'Click Play to field a marble from home, or click a home marble slot, or select a marble on the board to move it.' }
  if (base === 'ten')
    return { icon: '🎯', text: 'Click Play to force the next player to discard a card, or click your marble to move 10.' }
  if (base === 'queen')
    return { icon: '👑', text: 'Click Play to make a random player discard a card, or click your marble to move 12.' }
  if (base === 'jack')
    return { icon: '🔄', text: "Click your marble + an opponent's to swap them, or just yours to move 11." }
  if (base === 'seven')
    return { icon: '✂️', text: 'Click 1 marble to move all 7, or click 2 marbles to split. Adjust split with the slider.' }
  if (base === 'four')
    return { icon: '⬅️', text: 'Click your marble — it will move 4 steps backward.' }
  if (base === 'marbleburner')
    return { icon: '🔥', text: "Click an opponent's marble on the board to send it back home." }
  if (base === 'marblesaver')
    return { icon: '⭐', text: 'Click your own marble to instantly send it to a safe zone slot.' }
  if (base === 'five')
    return { icon: '5️⃣', text: "Click any marble (yours or an opponent's) to move it 5 steps forward." }
  return { icon: '▶️', text: 'Click your marble on the board to select it, then click Play.' }
}
