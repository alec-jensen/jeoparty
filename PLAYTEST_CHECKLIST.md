# Playtest Checklist

## 🔴 Critical Blockers — Game cannot be played without these

- [x] **Set `PUBLIC_ORIGIN` env var** — QR codes and join URLs point to `localhost` without it; mobile players on LAN can't join. Set in `docker-compose.yml` line 30 (currently commented out) or `.env`. *set on deployment*
- [x] **`BUZZER_OPEN` re-broadcast** — `openBuzzer()` already broadcasts on every call including after wrong answers. Non-issue.
- [x] **Daily Double wager: host now sees actual wager amount** — Fixed in `host.astro`: listens for `DAILY_DOUBLE_WAGER`, stores amount, shows it in judging panel (e.g. "★ DD WAGER $1000"). Auto-accepted flow was already working end-to-end.
- [x] **Host Final Jeopardy judging interface** — Already implemented: `showFinalModal` in `host.astro` shows all answers, wagers, WRONG/CORRECT/REVEAL buttons per player. Not a bug.
- [x] **"Start Game" button in board editor** — Intentional: dashboard has the game creation UI. *the dashboard has the start game interface*

---

## 🟠 Likely to Hit During Play

- [x] **Host page `ROUND_ADVANCE` handler** — Already handled in `host.astro` line 418; server also follows with `BOARD_STATE` which does a full sync. Non-issue.
- [x] **`BUZZER_LOCKED` unhandled on player** — Fixed in `play.astro`: now sets `canBuzz = false` immediately on receipt so the button disables before `BUZZ_WINNER` arrives.
- [ ] **Final Jeopardy clue not visible to host during judging** — `showFinalModal` shows the clue text and category. But the clue is NOT shown in the main clue card during the wager phase (before all answers are in). Host doesn't see what the question is until all players have answered.
- [ ] **Final Jeopardy: host can't preview clue before broadcasting** — Confirm dialog fires immediately. No way for host to see the clue text before it's sent to players. Make sure you know your FJ question before clicking.
- [ ] **No validation that Final Jeopardy clue exists before game start** — Server sends `ERROR` message if clue is empty. Fixed: host.astro now handles `ERROR` and shows an `alert()` so host sees the message instead of silence.
- [x] **Team game-over shows 0 scores** — `teamList()` already aggregates player scores per team. `play.astro` uses `t.score`. Non-issue.
- [ ] **Avatar change: accepted locally, rejected silently** — Server sends `AVATAR_TAKEN` but player sees their old avatar restored only after next `BOARD_STATE`. Toast shows but avatar visually snaps back. Minor.
- [x] **Final Jeopardy double-fire** — Fixed in `ws.ts`: `sendFinalResultsToHost` now guards with `resultsSent` flag.
- [x] **`REVEAL_FINAL_RESPONSE` role check** — Already inside `if (meta.role === 'host')` block. Non-issue.

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
