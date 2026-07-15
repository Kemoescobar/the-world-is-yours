# Docker — THE WORLD IS YOURS (local / prod-like)

Run the Express API and the Vite client (nginx) with Docker Compose. **Supabase Auth + DB stay in the cloud** — this stack does not start Postgres. Production remains **Railway (API) + Vercel (client)**; Docker is for local parity and optional self-host experiments.

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows) with Compose V2
- Values from existing `server/.env` and `client/.env` (Supabase URL/keys, `OWNER_USER_ID`, webhook keys)

## One-time setup (PowerShell)

From the repo root `C:\twiy`:

```powershell
Copy-Item .env.example .env
# Edit .env — paste real SUPABASE_*, VITE_*, OWNER_USER_ID, WEBHOOK_API_KEY, etc.
# Keep CLIENT_URL=http://localhost:8080 (matches the web service)
# Keep VITE_API_URL=http://localhost:4000/api (browser → host-mapped API)
```

Do **not** commit `.env` (gitignored).

## Build & start

```powershell
cd C:\twiy
docker compose up --build
```

Detached:

```powershell
docker compose up --build -d
```

Stop:

```powershell
docker compose down
```

Rebuild after changing `VITE_*` (they are build args):

```powershell
docker compose build --no-cache web
docker compose up -d
```

## URLs & ports

| Service | Host URL | Container |
|---------|----------|-----------|
| Web (nginx SPA) | http://localhost:8080 | `web` → port 80 |
| API (Express) | http://localhost:4000 | `api` → port 4000 |
| Health | http://localhost:4000/health | — |
| n8n (optional) | http://localhost:5678 | profile `n8n` |

Override host ports with `API_PORT` / `WEB_PORT` / `N8N_PORT` in `.env`.

**CORS:** `CLIENT_URL` in compose must equal the origin you open in the browser (default `http://localhost:8080`). Vite’s usual `http://localhost:5173` is for non-Docker `npm run dev` only.

## Optional n8n profile

Standalone n8n still lives at `n8n/docker-compose.yml`. From the **root**, start API + web + n8n together:

```powershell
# Optional: copy n8n/.env.example → n8n/.env for extra keys
docker compose --profile n8n up --build
```

Inside that network, workflows should call the API at `http://api:4000/api` (`TWIY_API_URL` in root `.env`). `TWIY_WEBHOOK_KEY` should match `WEBHOOK_API_KEY`.

## How this relates to prod (Vercel / Railway)

| Concern | Local Docker | Production |
|---------|--------------|------------|
| Client | `web` nginx image, port 8080 | Vercel (`client/`) |
| API | `api` Node 22 image, port 4000 | Railway (`server/`, `npm start`) |
| DB / Auth | Supabase cloud (same project) | Supabase cloud |
| CORS | `CLIENT_URL=http://localhost:8080` | `CLIENT_URL=https://<app>.vercel.app` |
| `VITE_API_URL` | `http://localhost:4000/api` | `https://<api>.up.railway.app/api` |

Docker does **not** replace Railway/Vercel deploys. Root `docker-compose.yml` and `*/Dockerfile` are additive; `server/railway.json` and `client/vercel.json` are unchanged.

Server listens on `0.0.0.0` and `PORT` (default 4000) so containers and Railway both work.

## Quick checks

```powershell
curl http://localhost:4000/health
# expect: {"ok":true,"systeme":"THE WORLD IS YOURS",...}

# Open the SPA
Start-Process http://localhost:8080
```

## Troubleshooting

- **CORS bloqué** — `CLIENT_URL` ≠ browser origin (include scheme + port; no trailing slash mismatch).
- **Blank API / HTML from fetch** — rebuild `web` after fixing `VITE_API_URL` (must be absolute `http://…`).
- **Auth / empty data** — confirm `SUPABASE_*` and `OWNER_USER_ID` in root `.env`.
- **n8n can’t reach API** — use `--profile n8n` so they share a network; prefer `http://api:4000/api` over `localhost` from inside the n8n container.
