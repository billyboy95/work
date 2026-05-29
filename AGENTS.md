# Zentrix Agent Platform

Full-stack autonomous agent orchestration platform with a Node.js/Express backend and Next.js frontend.

## Project Structure

- `backend/` — Node.js + Express API server (port 4000)
- `frontend/` — Next.js + React + TailwindCSS dashboard (port 3000)
- `docker-compose.yml` — PostgreSQL and Redis for local development

## Cursor Cloud specific instructions

### Services

| Service | Command | Port | Notes |
|---------|---------|------|-------|
| Backend API | `cd backend && npm run dev` | 4000 | Express with nodemon hot-reload |
| Frontend | `cd frontend && npm run dev` | 3000 | Next.js dev server |
| PostgreSQL | `docker compose up postgres -d` | 5432 | Optional for MVP; in-memory stores used currently |
| Redis | `docker compose up redis -d` | 6379 | Optional for MVP; in-memory stores used currently |

### Quick commands

- **Backend lint**: `cd backend && npm run lint`
- **Backend tests**: `cd backend && npm test`
- **Frontend lint**: `cd frontend && npm run lint`
- **Frontend build**: `cd frontend && npm run build`

### Caveats

- The backend currently uses in-memory data stores (Maps), so data resets on server restart. PostgreSQL/Redis integration is planned but not yet wired up; the `docker-compose.yml` services are provided for future use.
- The frontend calls `http://localhost:4000` by default (configured via `NEXT_PUBLIC_API_URL` in `frontend/.env.local`). The backend must be running for the dashboard to show agent/task data.
- Backend `.env` is created from `.env.example` — copy it if missing: `cp backend/.env.example backend/.env`.
- The frontend was scaffolded with Next.js 16 which has breaking changes from earlier versions. See `frontend/AGENTS.md` for framework-specific notes.
- Backend tests (`npm test`) run entirely in-memory via Supertest — no database or external services required.
- The frontend does not have a `.env.local` file by default; it uses `http://localhost:4000` as the API base URL via the hardcoded default in `src/app/page.tsx`.
