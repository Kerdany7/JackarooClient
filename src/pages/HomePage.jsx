import { useNavigate } from 'react-router-dom'
import styles from './HomePage.module.css'

const FEATURES = [
  {
    icon: '♠',
    title: 'Strategic Cards',
    desc: '54 unique cards with special powers — field marbles, swap positions, burn opponents, or split moves between pieces.',
  },
  {
    icon: '●',
    title: '4-Player Battle',
    desc: 'Race your 4 marbles around a 100-cell board against 3 CPU opponents, each making smart tactical decisions.',
  },
  {
    icon: '⚠',
    title: 'Trap Cells',
    desc: 'Watch your step — random trap cells are scattered across the board. Land on one and your marble returns home.',
  },
  {
    icon: '★',
    title: 'Safe Zones',
    desc: "Guide all 4 marbles into your Safe Zone to win. Once inside, they're protected from opponents.",
  },
]

export default function HomePage() {
  const nav = useNavigate()
  return (
    <div className={styles.page}>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.suits} aria-hidden>♦ ♠ ♣ ♥</div>
        <h1 className={styles.title}>JACKAROO</h1>
        <p className={styles.subtitle}>
          The classic marble &amp; card board game — reimagined for the web.
          Outplay your opponents, survive the traps, and race to victory.
        </p>
        <div className={styles.heroBtns}>
          <button className={styles.btnPrimary} onClick={() => nav('/lobby')}>
            Play Now
          </button>
          <button className={styles.btnSecondary} onClick={() => nav('/rules')}>
            How to Play
          </button>
        </div>

        {/* Decorative card fan */}
        <div className={styles.cardFan} aria-hidden>
          {['♠ K', '♥ A', '♦ 7', '♣ J', '★'].map((c, i) => (
            <div key={i} className={styles.fanCard} style={{ '--i': i }}>
              {c}
            </div>
          ))}
        </div>
      </section>

      {/* Feature grid */}
      <section className={styles.features}>
        <h2 className={styles.sectionTitle}>How it Works</h2>
        <div className={styles.grid}>
          {FEATURES.map((f) => (
            <div key={f.title} className={styles.featureCard}>
              <div className={styles.featureIcon}>{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Quick rules teaser */}
      <section className={styles.teaser}>
        <div className={styles.teaserInner}>
          <h2>Ready to Play?</h2>
          <p>
            Each turn, play a card from your hand to move marbles closer to your Safe Zone.
            Use special cards to sabotage opponents, field new marbles, or leap ahead.
            First player to fill their Safe Zone wins.
          </p>
          <button className={styles.btnPrimary} onClick={() => nav('/lobby')}>
            Start a Game
          </button>
        </div>
      </section>
    </div>
  )
}
