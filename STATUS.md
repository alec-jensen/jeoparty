# Jeoparty — Status & Spec

## What is Jeoparty?

Jackbox meets Jeopardy. A self-hostable party game where a host runs a Jeopardy-style board on a big screen and players join from their phones as buzzers. No app install required — it's all in the browser.

---

## Stack

- **Framework:** Astro SSR (Node adapter, `output: 'server'`)
- **Frontend:** Astro pages + vanilla JS (no React)
- **Real-time:** `ws` WebSocket server sharing the same HTTP server via `upgrade` event
- **Database:** Drizzle ORM — MySQL/MariaDB (production) or SQLite (dev) auto-detected from `DATABASE_URL`
- **Auth:** Email/password with bcrypt (cost 12), JWT stored as httpOnly cookie, all tokens stored in DB
- **Deployment:** Docker + docker-compose — the only supported deployment method; config via env vars

---

## Design

- **Playful, colorful, modern.** Fredoka font for headings, Nunito for body. Bold colors. Jackbox energy — no clutter.
- **Animations:** Buzz button pulse, score pop, slide-up question reveal, flash feedback.
- **Three distinct modes:** Presenter (big screen), Host (controls), Player (phone buzzer). Each has its own fixed layout that scales to fit the viewport like Jackbox — not responsive/reflowing.
- **Sound effect stubs:** Functions are called at every key moment; actual audio files drop in later.

---

## Modes & Architecture

### Presenter Mode (`/game/<id>`)
- Big screen view. No auth required.
- Shows game board, scores, question overlays, buzz winner banner.
- Scales to fill any landscape display (1920×1080 base, CSS transform scale).

### Host Mode (`/game/<id>/host`)
- Requires auth matching the game creator.
- Accessible from a second window on the presenter device, **or** from any device by:
  1. Going to `/join` → entering game code → clicking "Join as Host"
  2. App checks if logged in and if they own the game → redirects to host controls
- Board grid to open questions, player list, judge buttons, score adjust, Final Jeopardy judging.

### Player Mode (`/game/<id>/play`)
- Phone web app. No account required.
- Join via `/join` (enter 4-letter code + nickname) or direct URL.
- Buzz button, board picker, Final Jeopardy input.
- Scales to fill any portrait phone (390px base, CSS transform scale).
- Auto-reconnects on WebSocket disconnect.

---

## Join Flow

- **Join page:** `/join` — enter 4-letter game code + nickname → join as player
- **Join as host:** small link on `/join` → "Join as Host" → checks auth → redirects to `/game/<id>/host`
- **Three entry points per game:** QR code on presenter, direct link, 4-letter join code
- Join codes are **case insensitive, 4 uppercase letters, A–Z** (e.g., `KQBF`)
- The game ID **is** the join code

---

## Boards & Rounds

- A board has **unlimited rounds** (minimum 1, default 1 called "Round 1")
- Each round has its own set of categories and questions
- Host advances to the next round manually with the "Next Round" button
- Final Jeopardy happens after all rounds (host triggers manually)

---

## Teams (Optional Mode)

- Enabled when starting a game from the dashboard
- Host sets number of teams (2–6)
- Team names: Team A, B, C, …
- Team score = sum of all member scores
- Host can move players between teams from the host controls
- Gameplay is identical to individual mode

---

## Buzzer Timing

Clock-synced: clients send `PING` on connect, server replies `PONG { serverTime }`, client stores offset. `BUZZ` messages include `clientTime: Date.now() + offset`. Server validates within the 5-second window.

---

## Database

Drizzle ORM. Auto-detected dialect from `DATABASE_URL`:
- `mysql://...` or `mariadb://...` → MySQL/MariaDB (production)
- `file:...` or `:memory:` → SQLite (development)
- For PostgreSQL: swap `src/lib/schema.ts` imports to `drizzle-orm/pg-core` and `db.ts` driver to `postgres`

Schema managed via `drizzle-kit push` (runs automatically at Docker startup).

### Tables
- `hosts` — auth accounts
- `auth_tokens` — all issued JWTs (for revocation)
- `boards` — game boards owned by hosts
- `rounds` — rounds within a board
- `categories` — categories within a round
- `questions` — questions within a category
- `games` — active/finished game instances (ID = 4-letter join code)
- `teams` — teams within a game
- `players` — players within a game (no account required)
- `used_questions` — tracks which questions have been played per game

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | Yes | — | DB connection string |
| `JWT_SECRET` | Yes | — | Secret for signing JWTs |
| `PORT` | No | `3000` | HTTP port |
| `DISABLE_REGISTRATION` | No | `false` | Set to `"true"` to disable new host signups |

---

## Deployment

```bash
# Build and start with Docker Compose
docker compose up -d --build
```

On startup: `drizzle-kit push` syncs the schema, then the app starts. MariaDB health check ensures the DB is ready before the app starts.

---

## Sound Effect Stubs

Wired at these moments in the player view (`play.astro`). Drop audio files in `public/sounds/` and update `sounds.*` functions to call `new Audio('/sounds/...').play()`:

- `buzzerOpen()` — when the buzz window opens
- `buzzIn()` — when the player wins the buzz
- `correct()` — correct answer
- `wrong()` — wrong answer
- `dailyDouble()` — Daily Double revealed
- `finalTheme()` — Final Jeopardy wager phase
- `gameOver()` — game ends

---

## WebSocket Protocol

All messages are JSON. Clients connect to `/ws?gameId=<id>&token=<jwt>`. Presenters connect without a token (read-only).

Key server→client messages: `BOARD_STATE`, `GAME_START`, `QUESTION_OPEN`, `BUZZER_OPEN`, `BUZZER_LOCKED`, `BUZZ_WINNER`, `QUESTION_RESULT`, `QUESTION_CLOSED`, `ROUND_ADVANCE`, `START_FINAL_JEOPARDY`, `FINAL_JEOPARDY_START`, `FINAL_JEOPARDY_END`, `GAME_OVER`, `PLAYER_JOINED`, `PLAYER_KICKED`, `SCORE_UPDATE`, `PONG`

Key host→server messages: `GAME_START`, `OPEN_QUESTION`, `JUDGE`, `DAILY_DOUBLE_WAGER_ACCEPTED`, `KICK_PLAYER`, `ADJUST_SCORE`, `MOVE_PLAYER`, `ADVANCE_ROUND`, `START_FINAL_JEOPARDY`, `JUDGE_FINAL`, `END_GAME`

Key player→server messages: `BUZZ`, `SELECT_QUESTION`, `DAILY_DOUBLE_WAGER`, `FINAL_WAGER`, `FINAL_ANSWER`

---

## What's Done

- [x] Drizzle ORM — MySQL/MariaDB + SQLite, multi-dialect auto-detection
- [x] Auth — register, login, logout, JWT + DB token revocation, `DISABLE_REGISTRATION` flag
- [x] Board CRUD with multi-round support — create, edit, delete boards with rounds/categories/questions
- [x] Game creation — 4-letter join codes, optional team mode
- [x] `/join` page — player join flow + "Join as Host" flow
- [x] Presenter mode (`/game/<id>`) — scaled big-screen view, read-only WS connection
- [x] Host controls (`/game/<id>/host`) — board grid, players, judge, score adjust, Final Jeopardy judging, team view
- [x] Player view (`/game/<id>/play`) — scaled phone view, auto-reconnect, full game flow
- [x] WebSocket server — shared HTTP server, presenter/host/player roles, auth on connect
- [x] In-memory game state — rounds, teams, board loading, player tracking
- [x] PING/PONG clock sync
- [x] Buzzer logic — synced window, elimination on wrong answer
- [x] Daily Double flow
- [x] Final Jeopardy flow — wager phase, answer phase, host judging, results
- [x] Multi-round support — advance round, board state per round
- [x] Team mode — DB model, team scores, host can move players
- [x] Rate limiting — 120 req/min per IP on API routes, gameplay WS unaffected
- [x] Design overhaul — Fredoka font, animations, Jackbox-style scaling
- [x] Sound effect stubs — all key moments wired
- [x] QR code — server-side SVG, shown on presenter and host screens
- [x] Docker — Dockerfile + docker-compose.yml with MariaDB, healthcheck, `drizzle-kit push` on startup

---

## What's Not Done / Known Issues

- [ ] **Player swap requests** — players can't yet request to swap teams from their phone (host can move manually)
- [x] **Presenter view reconnect** — auto-reconnects on WS disconnect (same as player view)
- [x] **Auth redirect after login** — `?next=` param is now read on page load and honoured on successful login; already-logged-in users are also redirected to `?next=` if present
- [ ] **No 404 / error pages**
- [ ] **No final Jeopardy question source** — currently picks first unused question; should have a dedicated FJ question per board
- [ ] **PostgreSQL support** — requires swapping two imports in `db.ts` and `schema.ts`; documented but not a toggle
