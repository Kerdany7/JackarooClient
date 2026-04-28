import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL || ''
const solo  = axios.create({ baseURL: `${BASE}/api/game` })
const lobby = axios.create({ baseURL: `${BASE}/api/lobby` })
// ── Single-player ────────────────────────────────────────────────────────────
export const startGame        = (playerName) => solo.post('/start',     null, { params: { playerName } }).then(r => r.data)
export const getState         = ()           => solo.get('/state').then(r => r.data)
export const selectCard       = (cardIndex)  => solo.post('/select-card', null, { params: { cardIndex } }).then(r => r.data)
export const selectMarble     = (marbleIndex)=> solo.post('/select-marble', null, { params: { marbleIndex } }).then(r => r.data)
export const play             = ()           => solo.post('/play').then(r => r.data)
export const endTurn          = ()           => solo.post('/end-turn').then(r => r.data)
export const cpuStep          = ()           => solo.post('/cpu-step').then(r => r.data)
export const setSplitDistance = (distance)  => solo.post('/set-split', null, { params: { distance } }).then(r => r.data)
export const deselect         = ()           => solo.post('/deselect').then(r => r.data)
export const restart          = ()           => solo.post('/restart').then(r => r.data)

// ── Multiplayer lobby ────────────────────────────────────────────────────────
const auth = (token) => ({ headers: { 'X-Session-Token': token } })

export const createRoom  = (hostName)             => lobby.post('/create', null, { params: { hostName } }).then(r => r.data)
export const joinRoom    = (roomCode, playerName)  => lobby.post(`/${roomCode}/join`, null, { params: { playerName } }).then(r => r.data)
export const getLobby    = (roomCode, token)       => lobby.get(`/${roomCode}`, auth(token)).then(r => r.data)
export const startRoom   = (roomCode, token)       => lobby.post(`/${roomCode}/start`, null, auth(token)).then(r => r.data)
export const kickPlayer  = (roomCode, token, playerName) =>
  lobby.post(`/${roomCode}/kick`, null, { ...auth(token), params: { playerName } }).then(r => r.data)
export const leaveRoom   = (roomCode, token)       => lobby.post(`/${roomCode}/leave`, null, auth(token))
export const heartbeat   = (roomCode, token)       => lobby.post(`/${roomCode}/heartbeat`, null, auth(token)).catch(() => {})

// Room game actions
export const roomSelectCard       = (roomCode, token, cardIndex)   => lobby.post(`/${roomCode}/select-card`,   null, { ...auth(token), params: { cardIndex } }).then(r => r.data)
export const roomSelectMarble     = (roomCode, token, marbleIndex) => lobby.post(`/${roomCode}/select-marble`, null, { ...auth(token), params: { marbleIndex } }).then(r => r.data)
export const roomPlay             = (roomCode, token)              => lobby.post(`/${roomCode}/play`,          null, auth(token)).then(r => r.data)
export const roomEndTurn          = (roomCode, token)              => lobby.post(`/${roomCode}/end-turn`,      null, auth(token)).then(r => r.data)
export const roomDeselect         = (roomCode, token)              => lobby.post(`/${roomCode}/deselect`,      null, auth(token)).then(r => r.data)
export const roomGetState         = (roomCode, token)              => lobby.get(`/${roomCode}/game-state`,     auth(token)).then(r => r.data)
export const roomSetSplitDistance = (roomCode, token, distance)    => lobby.post(`/${roomCode}/set-split`, null, { ...auth(token), params: { distance } }).then(r => r.data)
