import styles from './RulesPage.module.css'

const CARD_RULES = [
  { rank: 'A',  name: 'Ace',          suit: '♠♣♦♥', type: 'field',   desc: 'Field a marble from the Home Zone onto the board, OR move one of your marbles 1 step forward.' },
  { rank: '2',  name: 'Two',          suit: '♠♣♦♥', type: 'move',    desc: 'Move one of your own marbles 2 steps forward.' },
  { rank: '3',  name: 'Three',        suit: '♠♣♦♥', type: 'move',    desc: 'Move one of your own marbles 3 steps forward.' },
  { rank: '4',  name: 'Four',         suit: '♠♣♦♥', type: 'special', desc: 'Move one of your own marbles 4 steps BACKWARD.' },
  { rank: '5',  name: 'Five',         suit: '♠♣♦♥', type: 'special', desc: 'Move ANY marble on the track (yours or an opponent\'s) 5 steps forward.' },
  { rank: '6',  name: 'Six',          suit: '♠♣♦♥', type: 'move',    desc: 'Move one of your own marbles 6 steps forward.' },
  { rank: '7',  name: 'Seven',        suit: '♠♣♦♥', type: 'special', desc: 'Split 7 steps across two of your marbles (any combination 1-6), OR move one marble the full 7 steps.' },
  { rank: '8',  name: 'Eight',        suit: '♠♣♦♥', type: 'move',    desc: 'Move one of your own marbles 8 steps forward.' },
  { rank: '9',  name: 'Nine',         suit: '♠♣♦♥', type: 'move',    desc: 'Move one of your own marbles 9 steps forward.' },
  { rank: '10', name: 'Ten',          suit: '♠♣♦♥', type: 'special', desc: 'Discard a random card from the next player and skip their turn, OR move one of your marbles 10 steps forward.' },
  { rank: 'J',  name: 'Jack',         suit: '♠♣♦♥', type: 'special', desc: 'Swap one of your marbles with any other marble on the board, OR move one of your marbles 11 steps forward.' },
  { rank: 'Q',  name: 'Queen',        suit: '♠♣♦♥', type: 'special', desc: 'Discard a random card from a random opponent and skip their turn, OR move one of your marbles 12 steps forward.' },
  { rank: 'K',  name: 'King',         suit: '♠♣♦♥', type: 'field',   desc: 'Field a marble from the Home Zone onto the board, OR move one of your marbles 13 steps forward — destroying every marble in its path.' },
  { rank: '🔥', name: 'Marble Burner', suit: 'Wild', type: 'wild',    desc: 'Select any opponent marble currently on the track and send it back to their Home Zone.' },
  { rank: '⭐', name: 'Marble Saver',  suit: 'Wild', type: 'wild',    desc: 'Move one of your marbles (from the track or Home Zone) directly to a random empty cell in your Safe Zone.' },
]

const TYPE_BADGE = {
  move:    { label: 'Move',    color: '#3498db' },
  field:   { label: 'Field',   color: '#27ae60' },
  special: { label: 'Special', color: '#f39c12' },
  wild:    { label: 'Wild',    color: '#a855f7' },
}

const BOARD_RULES = [
  { icon: '●', title: 'Marble Movement', body: 'Marbles travel clockwise around the 100-cell track. You cannot move a marble past your own stationary marble unless explicitly allowed by the card.' },
  { icon: '⌂', title: 'Home Zone', body: 'Each player starts all 4 marbles here. Use an Ace or King card to field a marble onto the starting base cell.' },
  { icon: '★', title: 'Safe Zone', body: 'At the end of each player\'s section, 4 Safe Zone cells lead inward. Once inside, marbles can only move forward and cannot be targeted by opponents.' },
  { icon: '⚑', title: 'Base Cell', body: 'The colored cell at the entrance of each player\'s track section. A marble fields here when brought out. Base cells cannot be used to block.' },
  { icon: '⚠', title: 'Trap Cells', body: '8 cells are randomly chosen as traps each game. Landing on a trap immediately sends that marble back to the Home Zone — even your own.' },
  { icon: '✖', title: 'Capturing', body: 'If you land on a cell occupied by an opponent\'s marble, that marble is sent home. Marbles in the Safe Zone and on Base cells are protected.' },
]

export default function RulesPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p className={styles.headerSuits}>♦ ♠ ♣ ♥</p>
        <h1>Rules of the Game</h1>
        <p className={styles.headerSub}>
          Jackaroo is a 4-player marble racing game. Be the first to get all 4 of your marbles
          into your Safe Zone to win.
        </p>
      </header>

      <div className={styles.content}>
        {/* Objective */}
        <section className={styles.section}>
          <h2>Objective</h2>
          <div className={styles.objectiveCard}>
            <span className={styles.objectiveIcon}>🏆</span>
            <p>
              Move all <strong>4 of your marbles</strong> from the Home Zone, around the 100-cell
              circular track, and into your <strong>Safe Zone</strong>. The first player to fill
              their Safe Zone wins.
            </p>
          </div>
        </section>

        {/* Setup */}
        <section className={styles.section}>
          <h2>Setup</h2>
          <ul className={styles.list}>
            <li>4 players — 1 human and 3 CPU opponents.</li>
            <li>Each player receives a colour (Green, Red, Yellow, Blue) and 4 marbles.</li>
            <li>All marbles start in each player's Home Zone.</li>
            <li>The deck of 54 cards is shuffled. Each player is dealt <strong>4 cards</strong> per round.</li>
            <li>8 random trap cells are placed secretly across the board.</li>
          </ul>
        </section>

        {/* Turn flow */}
        <section className={styles.section}>
          <h2>Turn Flow</h2>
          <div className={styles.steps}>
            {[
              ['1', 'Select Card', 'Choose one card from your hand to play this turn.'],
              ['2', 'Select Marble', 'Choose which of your marbles the card will affect (some cards act on opponents).'],
              ['3', 'Play', 'Execute the card\'s action. Invalid moves are rejected — try a different marble or card.'],
              ['4', 'End Turn', 'Discard the played card and pass the turn. CPU players take their turns automatically.'],
            ].map(([n, title, desc]) => (
              <div key={n} className={styles.step}>
                <div className={styles.stepNum}>{n}</div>
                <div>
                  <strong>{title}</strong>
                  <p>{desc}</p>
                </div>
              </div>
            ))}
          </div>
          <p className={styles.note}>
            After all players have played 4 rounds, hands are reshuffled from the discard pile and new cards are dealt.
          </p>
        </section>

        {/* Board rules */}
        <section className={styles.section}>
          <h2>Board Rules</h2>
          <div className={styles.boardGrid}>
            {BOARD_RULES.map((r) => (
              <div key={r.title} className={styles.boardRule}>
                <span className={styles.ruleIcon}>{r.icon}</span>
                <div>
                  <strong>{r.title}</strong>
                  <p>{r.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Card reference */}
        <section className={styles.section}>
          <h2>Card Reference</h2>
          <p className={styles.tableNote}>All cards in the deck and their effects.</p>
          <div className={styles.cardGrid}>
            {CARD_RULES.map((card) => {
              const badge = TYPE_BADGE[card.type]
              const isRed = card.suit.includes('♦') || card.suit.includes('♥')
              const isWild = card.type === 'wild'
              return (
                <div key={card.name} className={`${styles.cardRule} ${isWild ? styles.wildRule : ''}`}>
                  <div className={styles.cardRuleHeader}>
                    <div
                      className={styles.cardRank}
                      style={{ color: isWild ? '#a855f7' : isRed ? '#e74c3c' : 'var(--text)' }}
                    >
                      {card.rank}
                    </div>
                    <div className={styles.cardMeta}>
                      <span className={styles.cardName}>{card.name}</span>
                      <span className={styles.cardSuit}>{card.suit}</span>
                    </div>
                    <span className={styles.badge} style={{ background: `${badge.color}22`, color: badge.color, borderColor: `${badge.color}44` }}>
                      {badge.label}
                    </span>
                  </div>
                  <p className={styles.cardDesc}>{card.desc}</p>
                </div>
              )
            })}
          </div>
        </section>

        {/* Tips */}
        <section className={styles.section}>
          <h2>Strategy Tips</h2>
          <div className={styles.tips}>
            <div className={styles.tip}>
              <strong>Field early.</strong> Use Aces and Kings to get marbles on the board quickly — you need all 4 in play to win.
            </div>
            <div className={styles.tip}>
              <strong>Block with marbles.</strong> A marble on the track prevents opponents from passing that cell, creating a natural roadblock.
            </div>
            <div className={styles.tip}>
              <strong>Save your 7.</strong> The Seven card's split mechanic lets you advance two marbles at once — powerful near the Safe Zone.
            </div>
            <div className={styles.tip}>
              <strong>Use the Burner wisely.</strong> The Marble Burner can demolish a threatening opponent marble. Timing is everything.
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
