# jeoparty

Self-hostable Jackbox-meets-Jeopardy built with Astro SSR + WebSockets + MariaDB.

## Env

```bash
DATABASE_URL=mysql://user:pass@localhost:3306/jeoparty
JWT_SECRET=changeme
PORT=3000
```

## Run

```bash
npm install
npm run dev
npm run build
npm run start
```

## Core routes

- `/` host auth
- `/dashboard` board list and game launch
- `/boards/new`, `/boards/[id]` board editor
- `/game/[id]` host controls
- `/game/[id]/play` mobile player app
