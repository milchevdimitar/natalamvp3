# Natala backend

NestJS API (Fastify) on Postgres 16 + PostGIS, with Redis. Database and Redis
run in Docker; the API runs with Node on your machine.

## Requirements

- Docker Desktop (running)
- Node.js 22

## First run

```bash
cd backend
cp .env.example .env
npm install
npm run db:setup     # start Postgres + Redis, apply migrations, load seeds
npm run db:test      # smoke test: daily gift, MBTI scoring, discovery, match, friends
npm run dev          # API on http://localhost:4000/v1 (restarts on file changes)
```

The smoke test runs in a transaction and rolls back, so you can run it as often as you like.

## Try the API

```bash
curl localhost:4000/v1/health

# sign in as a seeded test user (only works with DEV_LOGIN_ENABLED=true)
TOKEN=$(curl -s -X POST localhost:4000/v1/auth/dev -H 'content-type: application/json' \
  -d '{"email":"ana@natala.local"}' | node -pe 'JSON.parse(require("fs").readFileSync(0)).accessToken')

curl -H "authorization: Bearer $TOKEN" localhost:4000/v1/me
curl -X POST -H "authorization: Bearer $TOKEN" localhost:4000/v1/daily/tarot/open
curl -H "authorization: Bearer $TOKEN" "localhost:4000/v1/tests/mbti?locale=bg"
```

## Endpoints so far

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/v1/health` | Public |
| POST | `/v1/auth/dev` | `{ email }` → tokens. Dev only |
| POST | `/v1/auth/refresh` | `{ refreshToken }` → new tokens; the old refresh token stops working |
| POST | `/v1/auth/logout` | `{ refreshToken }` |
| GET | `/v1/me` | Profile + streak |
| GET | `/v1/me/results/:system` | Own result for a lens (`mbti`, …) or `null` |
| POST | `/v1/daily/:kind/open` | `tarot`, `fortune` or `sky`; same item all day |
| GET | `/v1/tests/:system?locale=bg` | Questions (no scoring keys) |
| POST | `/v1/tests/:testId/submissions` | `{ answers: [{ questionId, value 1–7 }] }` → `{ type, dimensions }` |

Every route except health and auth needs `Authorization: Bearer <accessToken>`.
Access tokens last 15 minutes; the app refreshes them automatically.

## Everyday commands

| Command | What it does |
| --- | --- |
| `npm run db:start` | Start Postgres and Redis |
| `npm run db:migrate` | Apply new files in `db/migrations` |
| `npm run db:seed` | Load everything in `db/seeds` (safe to re-run) |
| `npm run db:psql` | Open a SQL shell |
| `npm run db:reset` | Wipe the database and set it up again |
| `npm run db:stop` | Stop the containers (data is kept) |

Connect a GUI client (TablePlus, DBeaver, pgAdmin) with:
`postgres://natala:natala@localhost:5432/natala`

## Seed data

- `01_content.sql` — tarot cards, fortunes and sky texts from the Home screen demo
- `02_mbti_bg.sql` — the 40 MBTI questions from `src/screens/MBTI.tsx` (Bulgarian)
- `03_dev_users.sql` — test users Ana, Ben (dating, near each other in Bern) and Cleo

## Adding a migration

Create a new file `db/migrations/<timestamp>_<name>.sql` with `-- migrate:up` and
`-- migrate:down` sections (or `docker compose run --rm dbmate new <name>`), then
`npm run db:migrate`. Never edit a migration that has already run on a shared database.
