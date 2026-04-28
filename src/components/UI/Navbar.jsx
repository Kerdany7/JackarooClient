import { Link, useLocation } from 'react-router-dom'
import styles from './Navbar.module.css'

const NAV_LINKS = [['/', 'Home'], ['/rules', 'Rules'], ['/lobby', 'Play']]

export default function Navbar() {
  const { pathname } = useLocation()
  return (
    <nav className={styles.nav}>
      <Link to="/" className={styles.brand}>
        <span className={styles.diamond}>♦</span>
        JACKAROO
      </Link>
      <div className={styles.links}>
        {NAV_LINKS.map(([path, label]) => (
          <Link
            key={path}
            to={path}
            className={`${styles.link} ${pathname === path || (path === '/lobby' && (pathname.startsWith('/room') || pathname.startsWith('/multiplayer') || pathname === '/game')) ? styles.active : ''}`}
          >
            {label}
          </Link>
        ))}
      </div>
    </nav>
  )
}
