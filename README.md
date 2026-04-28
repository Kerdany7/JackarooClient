# Jackaroo — Frontend

> React frontend for Jackaroo, a real-time online multiplayer card board game.

**Backend repo:** [JackarooServer](https://github.com/Kerdany7/JackarooServer)

---

## Pages

| Route | Description |
|---|---|
| `/` | Home page with game overview and feature highlights |
| `/rules` | Full card reference and board rules |
| `/lobby` | Enter your name, create a room or join with a code |
| `/room/:roomCode` | Waiting room — shows connected players, host can start |
| `/multiplayer/:roomCode` | Live multiplayer game |
| `/game` | Solo game vs 3 CPU opponents |

---

## Tech Stack

| | |
|---|---|
| Framework | React 19 |
| Build tool | Vite |
| Routing | React Router v7 |
| HTTP | Axios |
| WebSocket | STOMP over SockJS (`@stomp/stompjs`) |
| Styling | CSS Modules |

---

## Running Locally

**Prerequisites:** Node.js 18+, the backend running on `http://localhost:8080`

```bash
git clone https://github.com/Kerdany7/JackarooClient.git
cd JackarooClient
npm install
npm run dev
```

App runs on `http://localhost:5173`. API calls are proxied to `http://localhost:8080` automatically via Vite config — no CORS issues locally.

---

## Project Structure

```
src/
├── api/
│   └── gameApi.js        # All axios calls (solo + multiplayer)
├── components/
│   ├── Board/            # GameBoard component
│   ├── Cards/            # GameCard, PlayerHand
│   └── UI/               # Navbar
├── pages/
│   ├── HomePage.jsx
│   ├── RulesPage.jsx
│   ├── LobbyPage.jsx
│   ├── RoomPage.jsx      # Waiting room
│   ├── GamePage.jsx      # Solo game
│   └── MultiGamePage.jsx # Multiplayer game
└── utils/
    ├── cardHints.js      # Card tooltip descriptions
    └── sounds.js         # Sound effect helpers
```

---

## Status

> Work in progress — core gameplay is functional, some edge cases are still being worked on.
