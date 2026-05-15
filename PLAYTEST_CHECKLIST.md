# Playtest Checklist

## 🔴 Critical Blockers — Game cannot be played without these

- [ ] **Set `PUBLIC_ORIGIN` env var** — QR codes and join URLs point to `localhost` without it; mobile players on LAN can't join. Set in `docker-compose.yml` line 30 (currently commented out) or `.env`.
- [ ] **`BUZZER_OPEN` not re-broadcast after wrong answer** — `openBuzzer()` is only broadcast once at line 188 of `ws.ts`. At line 222, when a player answers wrong and the buzzer re-opens, no `BUZZER_OPEN` message is sent. Players have no idea the buzzer is active again after an elimination.
- [ ] **Daily Double wager flow is broken** — Players send `DAILY_DOUBLE_WAGER` (ws.ts:766) but the host UI has no interface to accept/confirm the wager, and no way to see or approve it before the clue is revealed. Daily Doubles will hang the game indefinitely.
- [ ] **Host has no Final Jeopardy judging interface** — `host-game.ts` sends `JUDGE_FINAL` (line 96) but `host.astro` never renders the submitted answers or wagers for the host to read. The host cannot judge without a separate display showing what everyone wrote.
- [ ] **"Start Game" button in board editor goes to `/dashboard`** — `boards/[id].astro` line 1140–1142 redirects to `/dashboard` instead of creating a game. Users can't launch a game from the board editor.

---

## 🟠 Likely to Hit During Play

- [ ] **Host page has no handler for `ROUND_ADVANCE`** — `host-game.ts` doesn't listen for this message, so the host UI won't refresh round info when advancing rounds.
- [ ] **`BUZZER_LOCKED` broadcast but never handled by any client** — `ws.ts` line 168 broadcasts this, but host, player, and presenter pages have no handler. Buzzer state can get out of sync.
- [ ] **Final Jeopardy clue not visible to host during judging** — The host never sees the category or clue text while judging answers. `host.astro` `updateClueCard()` doesn't render final clue when `game.status === 'final_jeopardy'`.
- [ ] **Final Jeopardy: host can't preview clue before broadcasting** — Clicking "Final Jeoparty" in the menu immediately fires `START_FINAL_JEOPARDY`. No confirmation or preview of the board's `finalQuestion` before it's sent to players.
- [ ] **No validation that Final Jeopardy clue exists before game start** — A board with no Final Jeopardy clue will play fine until `ADVANCE_ROUND` fires at the end, at which point `ws.ts` line 735 throws `"This board has no Final Jeopardy clue."` — unrecoverable during play.
- [ ] **Team game-over screen shows 0 for all team scores** — `renderGameOver()` in `play.astro` shows teams but teams have no aggregated `score` property; all display as 0.
- [ ] **Avatar change: accepted locally, rejected silently** — Server sends `AVATAR_TAKEN` on conflict, but the player page only shows a toast and the avatar change appears to stick locally. Player sees wrong state.
- [ ] **Final Jeopardy double-fire race condition** — If all players submit before the 30s timer, `sendFinalResultsToHost` fires on submission completion AND again on timeout, potentially double-rendering on the host.
- [ ] **`REVEAL_FINAL_RESPONSE` has no role check** — Any WebSocket client (player or presenter) can send this message and advance scores. Should verify `meta.role === 'host'`.

---

## 🟡 Polish — Won't break play but will feel rough

- [ ] **No error UI for "game already ended" on join** — API returns `"This game has already ended."` but the player just sees generic "Could not join." with no explanation.
- [ ] **Score header shows "RANK —" before first sync** — `myScoreEntry()` returns undefined until first `SCORE_UPDATE`. Brief but jarring.
- [ ] **Presenter board doesn't reset cell highlight on `QUESTION_CLOSED`** — `highlightBuzzedPlayer(null)` is called but no board cell state is reset; highlighting may persist.
- [ ] **Presenter board may have empty grid cells** — If categories have uneven question counts, cells render as empty gaps in the grid (`[id].astro` lines 1000–1003).
- [ ] **Final Jeopardy countdown auto-submit fires on undefined element** — For ineligible players (score ≤ 0), the answer input isn't rendered but the timeout still fires, causing a silent no-op instead of a graceful skip.
- [ ] **No visual feedback when buzzer is locked during Daily Double** — Other players see `renderWaiting()` with no explanation of why they can't buzz.
- [ ] **Audio gate has no visible affordance** — `[id].astro` line 406–424 blocks the presenter screen until clicked, but the gate may be hidden behind other content (z-index issue).
- [ ] **Game code font is 10px on player screen** — Very hard to read or share (`play.astro` line 638).
- [ ] **REVEAL button on Final Jeopardy modal is visually faded but not actually `disabled`** — Clicking it does nothing but the user has no feedback. (`host.astro` line 830–832).

---

## 🔵 Out of Scope / Skip Tonight

- [ ] Host notes field — UI exists but column missing in DB schema + API; data is silently lost. Not needed for play.
- [ ] SQLite foreign key constraints not enabled in dev (`PRAGMA foreign_keys = ON` missing in `db.ts`).
- [ ] JWT_SECRET fallback string used in dev — not a playtest issue.
- [ ] Team naming state lost on disconnect — only matters if someone hard-refreshes during team naming.
- [ ] Rejoin flow doesn't detect finished game state.
- [ ] Player limit enforcement — no max player count check on join.
- [ ] Player can't change nickname/avatar after joining.
- [ ] 404 / error pages missing across the app.
- [ ] `.env.example` file missing from repo.
- [ ] README doesn't document `PUBLIC_ORIGIN` or `DISABLE_REGISTRATION` env vars.
