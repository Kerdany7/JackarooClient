import styles from './GameBoard.module.css'

// ── Constants ────────────────────────────────────────────────────────────────
const S   = 800
const C   = 400
const TR  = 282   // track radius
const CR  = 9     // track cell radius
const SZR = [240, 200, 162, 124]

const COLOUR_HEX = {
  GREEN:  '#27ae60',
  RED:    '#e74c3c',
  YELLOW: '#f1c40f',
  BLUE:   '#3498db',
}
const COLOUR_LIGHT = {
  GREEN:  '#6ee89c',
  RED:    '#f47c6e',
  YELLOW: '#ffe066',
  BLUE:   '#74c0f7',
}
const COLOUR_DARK = {
  GREEN:  '#0d4a23',
  RED:    '#5a0a0a',
  YELLOW: '#5a4200',
  BLUE:   '#0a2d5a',
}
const COLOUR_LETTER = { GREEN: 'G', RED: 'R', YELLOW: 'Y', BLUE: 'B' }

// homeCenter = visual centre of the 2×2 marble grid
// labelX/Y   = where the player-name text goes (outside the home box)
const SECTION_META = [
  // TOP  — label sits BELOW the home box (between box and track)
  { safeAngle: -Math.PI / 2, homeCenter: [C, 44],
    labelX: C,   labelY: 78,  labelAnchor: 'middle' },
  // RIGHT — label sits ABOVE the home box
  { safeAngle: 0,            homeCenter: [756, C],
    labelX: 756, labelY: 368, labelAnchor: 'middle' },
  // BOTTOM — label sits ABOVE the home box (between track and box)
  { safeAngle: Math.PI / 2,  homeCenter: [C, 756],
    labelX: C,   labelY: 722, labelAnchor: 'middle' },
  // LEFT  — label sits ABOVE the home box
  { safeAngle: Math.PI,      homeCenter: [44, C],
    labelX: 44,  labelY: 368, labelAnchor: 'middle' },
]

// 2×2 marble grid offsets from homeCenter
const HOME_OFFSETS = [[-16, -11], [16, -11], [-16, 11], [16, 11]]

function cellXY(idx) {
  const a = (idx / 100) * 2 * Math.PI - Math.PI / 2
  return [C + TR * Math.cos(a), C + TR * Math.sin(a)]
}
function safeXY(angle, radius) {
  return [C + radius * Math.cos(angle), C + radius * Math.sin(angle)]
}

// ── SVG Defs ─────────────────────────────────────────────────────────────────
function Defs() {
  const colours = Object.keys(COLOUR_HEX)
  return (
    <defs>
      {colours.map(col => (
        <radialGradient key={col} id={`mg-${col}`} cx="35%" cy="30%" r="65%">
          <stop offset="0%"   stopColor={COLOUR_LIGHT[col]} />
          <stop offset="55%"  stopColor={COLOUR_HEX[col]} />
          <stop offset="100%" stopColor={COLOUR_DARK[col]} />
        </radialGradient>
      ))}
      <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
      <filter id="glowStrong" x="-80%" y="-80%" width="260%" height="260%">
        <feGaussianBlur stdDeviation="5" result="blur" />
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
      <filter id="glowGold" x="-80%" y="-80%" width="260%" height="260%">
        <feGaussianBlur stdDeviation="6" result="blur" />
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
      <radialGradient id="bgGrad" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#091428"/>
        <stop offset="100%" stopColor="#040a16"/>
      </radialGradient>
    </defs>
  )
}

// ── Marble ───────────────────────────────────────────────────────────────────
function Marble({ cx, cy, colour, selected, actionable, onClick, r = 8, lastMoved = false, colorBlind = false }) {
  const hex    = COLOUR_HEX[colour]  ?? '#aaa'
  const lite   = COLOUR_LIGHT[colour] ?? '#ccc'
  const letter = COLOUR_LETTER[colour] ?? '?'
  return (
    <g
      onClick={actionable ? onClick : undefined}
      style={{ cursor: actionable ? 'pointer' : 'default' }}
      filter={selected ? 'url(#glowStrong)' : lastMoved ? 'url(#glowGold)' : actionable ? 'url(#glow)' : undefined}
    >
      {/* Last-moved ring */}
      {lastMoved && !selected && (
        <circle cx={cx} cy={cy} r={r + 7} fill="none" stroke="#c9a84c" strokeWidth="1.5" opacity="0.8">
          <animate attributeName="r" values={`${r+5};${r+10};${r+5}`} dur="1.5s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.8;0.2;0.8" dur="1.5s" repeatCount="indefinite"/>
        </circle>
      )}
      {/* Selection pulse ring */}
      {selected && (
        <circle cx={cx} cy={cy} r={r + 6} fill="none" stroke={hex} strokeWidth="2" opacity="0.7">
          <animate attributeName="r" values={`${r+4};${r+9};${r+4}`} dur="1.2s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.7;0.15;0.7" dur="1.2s" repeatCount="indefinite"/>
        </circle>
      )}
      {/* Actionable dashed ring */}
      {actionable && !selected && (
        <circle cx={cx} cy={cy} r={r + 5} fill="none" stroke={hex} strokeWidth="1.5"
          strokeDasharray="4 2" opacity="0.6">
          <animateTransform attributeName="transform" type="rotate"
            from={`0 ${cx} ${cy}`} to={`360 ${cx} ${cy}`} dur="4s" repeatCount="indefinite"/>
        </circle>
      )}
      {/* Marble body */}
      <circle cx={cx} cy={cy} r={r} fill={`url(#mg-${colour})`}
        stroke={selected ? lite : `${hex}bb`} strokeWidth={selected ? 1.8 : 1}/>
      {/* Shine */}
      <circle cx={cx - r * 0.28} cy={cy - r * 0.28} r={r * 0.28} fill="rgba(255,255,255,0.45)"/>
      <circle cx={cx - r * 0.5}  cy={cy - r * 0.5}  r={r * 0.1}  fill="rgba(255,255,255,0.7)"/>
      {/* Colorblind label */}
      {colorBlind && (
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central"
          fontSize={r * 0.9} fontWeight="900" fill="#fff"
          style={{ pointerEvents: 'none', userSelect: 'none' }}>
          {letter}
        </text>
      )}
    </g>
  )
}

// ── Sparkle ───────────────────────────────────────────────────────────────────
function Sparkle({ cx, cy }) {
  const rays = 8
  return (
    <g style={{ pointerEvents: 'none' }}>
      {Array.from({ length: rays }, (_, i) => {
        const angle = (i / rays) * 2 * Math.PI
        return (
          <line key={i}
            x1={cx} y1={cy}
            x2={cx + 20 * Math.cos(angle)} y2={cy + 20 * Math.sin(angle)}
            stroke="#c9a84c" strokeWidth="1.5">
            <animate attributeName="opacity" values="0;1;0" dur="0.8s" begin={`${i * 0.05}s`} fill="freeze"/>
          </line>
        )
      })}
      <circle cx={cx} cy={cy} r={14} fill="none" stroke="#c9a84c" strokeWidth="1.5">
        <animate attributeName="r" values="4;18" dur="0.6s" fill="freeze"/>
        <animate attributeName="opacity" values="1;0" dur="0.6s" fill="freeze"/>
      </circle>
    </g>
  )
}

// ── Main Board ────────────────────────────────────────────────────────────────
export default function GameBoard({
  gameState,
  onSelectMarble,
  onFieldMarble,
  flashColours = [],
  sparkleColours = [],
  lastMovedTrackIndices = [],
  colorBlind = false,
  canField = false,
}) {
  const sectionColours = gameState?.safeZones
    ? gameState.safeZones.map(sz => sz.ownerColour)
    : ['GREEN', 'RED', 'YELLOW', 'BLUE']

  const track     = gameState?.track     ?? []
  const safeZones = gameState?.safeZones ?? []
  const players   = gameState?.players   ?? []

  const homeCount   = {}
  const playerNames = {}
  players.forEach(p => {
    homeCount[p.colour]   = p.homeCount ?? 4
    playerNames[p.colour] = p.name
  })

  return (
    <svg viewBox={`0 0 ${S} ${S}`} className={styles.board} aria-label="Jackaroo board">
      <Defs />

      {/* ── Background ── */}
      <circle cx={C} cy={C} r={398} fill="url(#bgGrad)" stroke="#1a2d4a" strokeWidth="1.5"/>
      <circle cx={C} cy={C} r={383} fill="none" stroke="#c9a84c10" strokeWidth="0.8"/>

      {/* ── Section tint wedges ── */}
      {sectionColours.map((col, pi) => {
        const hex = COLOUR_HEX[col] ?? '#888'
        const a0 = (pi * 25 / 100) * 2 * Math.PI - Math.PI / 2
        const a1 = ((pi + 1) * 25 / 100) * 2 * Math.PI - Math.PI / 2
        const r  = TR + CR + 20
        const x0 = C + r * Math.cos(a0), y0 = C + r * Math.sin(a0)
        const x1 = C + r * Math.cos(a1), y1 = C + r * Math.sin(a1)
        return (
          <path key={col} d={`M ${C} ${C} L ${x0} ${y0} A ${r} ${r} 0 0 1 ${x1} ${y1} Z`}
            fill={`${hex}0a`}/>
        )
      })}

      {/* ── Track shadow band ── */}
      <circle cx={C} cy={C} r={TR} fill="none" stroke="#060f1e" strokeWidth={CR * 2 + 20}/>
      <circle cx={C} cy={C} r={TR} fill="none" stroke="#0d1c33" strokeWidth={CR * 2 + 12}/>

      {/* ── Safe zone path lines ── */}
      {SECTION_META.map((meta, pi) => {
        const col = sectionColours[pi]
        const hex = COLOUR_HEX[col] ?? '#888'
        return SZR.slice(1).map((r2, i) => {
          const [x1, y1] = safeXY(meta.safeAngle, SZR[i])
          const [x2, y2] = safeXY(meta.safeAngle, r2)
          return (
            <line key={`szpath-${pi}-${i}`} x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={hex} strokeWidth="2" strokeOpacity="0.2"/>
          )
        })
      })}

      {/* ── Entry guide lines ── */}
      {SECTION_META.map((meta, pi) => {
        const col = sectionColours[pi]
        const hex = COLOUR_HEX[col] ?? '#888'
        const entryIdx = (pi * 25 - 2 + 100) % 100
        const [ex, ey] = cellXY(entryIdx)
        const [sx, sy] = safeXY(meta.safeAngle, SZR[0])
        return (
          <line key={`eguide-${pi}`} x1={ex} y1={ey} x2={sx} y2={sy}
            stroke={hex} strokeWidth="1" strokeOpacity="0.2" strokeDasharray="4 3"/>
        )
      })}

      {/* ── 100 track cells ── */}
      {Array.from({ length: 100 }, (_, i) => {
        const [x, y] = cellXY(i)
        const pi      = Math.floor(i / 25)
        const col     = sectionColours[pi]
        const hex     = COLOUR_HEX[col] ?? '#888'
        const isBase  = i % 25 === 0
        const cellData = track[i]
        const isTrap  = cellData?.trap
        const isEntry = cellData?.cellType === 'ENTRY'

        return (
          <g key={i}>
            <circle cx={x} cy={y}
              r={isBase ? CR + 4 : isEntry ? CR + 2 : CR}
              fill={isBase ? `${hex}28` : isTrap ? '#380808' : `${hex}16`}
              stroke={isTrap ? '#e74c3c' : isEntry ? `${hex}cc` : `${hex}55`}
              strokeWidth={isBase ? 2 : isEntry ? 1.5 : 0.8}
            />
            {isTrap && (
              <>
                <circle cx={x} cy={y} r={CR + 3} fill="none" stroke="#e74c3c" strokeWidth="1.2" strokeOpacity="0.5">
                  <animate attributeName="stroke-opacity" values="0.6;0.1;0.6" dur="1.4s" repeatCount="indefinite"/>
                  <animate attributeName="r" values={`${CR+2};${CR+5};${CR+2}`} dur="1.4s" repeatCount="indefinite"/>
                </circle>
                <text x={x} y={y} textAnchor="middle" dominantBaseline="central"
                  fontSize="8" fill="#e74c3c" style={{ pointerEvents: 'none' }}>⚠
                  <animate attributeName="opacity" values="1;0.3;1" dur="1.4s" repeatCount="indefinite"/>
                </text>
              </>
            )}
            {isEntry && !cellData?.marbleColour && (
              <text x={x} y={y} textAnchor="middle" dominantBaseline="central"
                fontSize="7" fill={`${hex}99`} style={{ pointerEvents: 'none' }}>›</text>
            )}
            {isBase && !cellData?.marbleColour && (
              <text x={x} y={y} textAnchor="middle" dominantBaseline="central"
                fontSize="7" fontWeight="700" fill={`${hex}88`}
                fontFamily="Cinzel,serif" style={{ pointerEvents: 'none' }}>
                {col?.[0]}
              </text>
            )}
          </g>
        )
      })}

      {/* ── Safe zone cells ── */}
      {SECTION_META.map((meta, pi) => {
        const col    = sectionColours[pi]
        const hex    = COLOUR_HEX[col] ?? '#888'
        const szData = safeZones.find(sz => sz.ownerColour === col)

        return SZR.map((r, depth) => {
          const [sx, sy] = safeXY(meta.safeAngle, r)
          const cellData = szData?.cells?.[depth]
          const isInner  = depth === SZR.length - 1
          const hasMb    = !!cellData?.marbleColour

          return (
            <g key={`sz-${pi}-${depth}`}>
              {isInner && (
                <circle cx={sx} cy={sy} r={CR + 7} fill={`${hex}0a`}/>
              )}
              <circle cx={sx} cy={sy} r={CR + 3}
                fill={hasMb ? `${hex}14` : isInner ? `${hex}44` : `${hex}1c`}
                stroke={hex} strokeWidth={isInner ? 2 : 1.5} strokeOpacity="0.8"
              />
              {isInner && !hasMb && (
                <text x={sx} y={sy} textAnchor="middle" dominantBaseline="central"
                  fontSize="9" fill={`${hex}80`} style={{ pointerEvents: 'none' }}>★
                  <animate attributeName="opacity" values="0.8;0.3;0.8" dur="2.5s" repeatCount="indefinite"/>
                </text>
              )}
              {!isInner && !hasMb && depth > 0 && (
                <circle cx={sx} cy={sy} r={2} fill={`${hex}55`}/>
              )}
            </g>
          )
        })
      })}

      {/* ── Home zones ── */}
      {SECTION_META.map((meta, pi) => {
        const col    = sectionColours[pi]
        const hex    = COLOUR_HEX[col] ?? '#888'
        const [hx, hy] = meta.homeCenter
        const count  = homeCount[col] ?? 0
        const isFlashing = flashColours.includes(col)

        return (
          <g key={`home-${pi}`}>
            {isFlashing && (
              <rect x={hx - 34} y={hy - 25} width={68} height={50} rx={12}
                fill="none" stroke={hex} strokeWidth="2.5" opacity="0.8">
                <animate attributeName="opacity" values="0.9;0;0.9" dur="0.5s" repeatCount="3"/>
              </rect>
            )}
            {/* Box outline */}
            <rect x={hx - 34} y={hy - 25} width={68} height={50} rx={10}
              fill={`${hex}0e`}
              stroke={canField ? `${hex}60` : `${hex}30`}
              strokeWidth={canField ? '1.5' : '1'}
              strokeDasharray="5 3"/>
            {/* Field pulse when canField */}
            {canField && count > 0 && (
              <rect x={hx - 34} y={hy - 25} width={68} height={50} rx={10}
                fill="none" stroke={hex} strokeWidth="2" opacity="0.4">
                <animate attributeName="opacity" values="0.5;0.08;0.5" dur="1s" repeatCount="indefinite"/>
              </rect>
            )}
            {/* Marble slots */}
            {HOME_OFFSETS.map(([dx, dy], si) => (
              <circle key={si} cx={hx + dx} cy={hy + dy} r={10}
                fill={si < count ? `${hex}22` : `${hex}08`}
                stroke={si < count ? `${hex}55` : `${hex}18`}
                strokeWidth="1.5"
                style={{ cursor: canField && si < count ? 'pointer' : 'default' }}
                onClick={canField && si < count ? onFieldMarble : undefined}
              />
            ))}
            {/* Player name label — positioned OUTSIDE the marble box */}
            <text
              x={meta.labelX} y={meta.labelY}
              textAnchor={meta.labelAnchor}
              fontSize="10" fontWeight="700"
              fill={`${hex}cc`} fontFamily="Cinzel,serif"
              style={{ pointerEvents: 'none' }}
            >
              {playerNames[col]
                ? playerNames[col].length > 10
                  ? playerNames[col].substring(0, 9) + '…'
                  : playerNames[col]
                : col}
            </text>
          </g>
        )
      })}

      {/* ── Marbles ON TRACK ── */}
      {track.map((cell, i) => {
        if (!cell?.marbleColour) return null
        const [x, y] = cellXY(i)
        return (
          <Marble key={`tm-${i}`}
            cx={x} cy={y}
            colour={cell.marbleColour}
            selected={cell.selected}
            actionable={cell.actionableIndex >= 0}
            lastMoved={lastMovedTrackIndices.includes(i)}
            onClick={() => onSelectMarble?.(cell.actionableIndex)}
            colorBlind={colorBlind}
          />
        )
      })}

      {/* ── Marbles IN SAFE ZONES ── */}
      {SECTION_META.map((meta, pi) => {
        const col    = sectionColours[pi]
        const szData = safeZones.find(sz => sz.ownerColour === col)
        if (!szData) return null
        return szData.cells.map((cell, depth) => {
          if (!cell?.marbleColour) return null
          const [sx, sy] = safeXY(meta.safeAngle, SZR[depth])
          const hasSparkle = sparkleColours.includes(cell.marbleColour)
          return (
            <g key={`szm-${pi}-${depth}`}>
              <Marble
                cx={sx} cy={sy}
                colour={cell.marbleColour}
                selected={cell.selected}
                actionable={cell.actionableIndex >= 0}
                onClick={() => onSelectMarble?.(cell.actionableIndex)}
                colorBlind={colorBlind}
              />
              {hasSparkle && <Sparkle cx={sx} cy={sy} />}
            </g>
          )
        })
      })}

      {/* ── Marbles IN HOME ── */}
      {SECTION_META.map((meta, pi) => {
        const col    = sectionColours[pi]
        const [hx, hy] = meta.homeCenter
        const count  = homeCount[col] ?? 0
        return HOME_OFFSETS.slice(0, count).map(([dx, dy], si) => (
          <Marble key={`hm-${pi}-${si}`}
            cx={hx + dx} cy={hy + dy}
            colour={col} r={8}
            selected={false} actionable={false}
            colorBlind={colorBlind}
          />
        ))
      })}

      {/* ── Active player pulse on base cell ── */}
      {gameState?.currentPlayerColour && (() => {
        const col = gameState.currentPlayerColour
        const pi  = sectionColours.indexOf(col)
        if (pi < 0) return null
        const [bx, by] = cellXY(pi * 25)
        const hex = COLOUR_HEX[col] ?? '#888'
        return (
          <circle cx={bx} cy={by} r={CR + 10} fill="none"
            stroke={hex} strokeWidth="2" strokeOpacity="0.5">
            <animate attributeName="r" values={`${CR+8};${CR+15};${CR+8}`} dur="2s" repeatCount="indefinite"/>
            <animate attributeName="stroke-opacity" values="0.5;0.1;0.5" dur="2s" repeatCount="indefinite"/>
          </circle>
        )
      })()}

      {/* ── Centre ornament ── */}
      <circle cx={C} cy={C} r={58} fill="#040a16" stroke="#c9a84c25" strokeWidth="1.5"/>
      <circle cx={C} cy={C} r={51} fill="none" stroke="#c9a84c14" strokeWidth="1"/>
      <text x={C} y={C - 7} textAnchor="middle" fontSize="11" fontWeight="700"
        fontFamily="Cinzel,serif" fill="#c9a84c" letterSpacing="1">JACKAROO</text>
      <text x={C} y={C + 10} textAnchor="middle" fontSize="9"
        fontFamily="serif" fill="#c9a84c55">♦ ♠ ♣ ♥</text>

    </svg>
  )
}
