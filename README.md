# TeamSpace

Vue 3 + NestJS + PostgreSQL. JWT (access in memory, refresh in httpOnly cookie + CSRF), real-time chat over WebSocket.

## Quick start (Docker)

```powershell
copy backend\.env.example backend\.env
docker compose up --build -d
docker compose exec backend npm run seed:admin
```

| Service  | URL                            |
| -------- | ------------------------------ |
| Frontend | http://localhost:8080          |
| API      | http://localhost:8000/api      |
| Swagger  | http://localhost:8000/api/docs |

Login: `BOOTSTRAP_ADMIN_USERNAME` / `BOOTSTRAP_ADMIN_PASSWORD` from `backend/.env` (default `admin` / `teamspace_admin`).

Stop: `docker compose down` · Reset DB: `docker compose down -v`

## Local development

**Requirements:** Node 20.19+ / 22.12+, PostgreSQL 17 (or only DB via Docker).

```powershell
# DB
docker compose -f docker-compose.backend.yml up db -d

# Backend
cd backend
copy .env.example .env
npm install
npm run start:dev
npm run seed:admin

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

- API: http://localhost:8000/api
- App: http://localhost:5173 (Vite proxies `/api` to backend)

Migrations run automatically on backend start. One initial migration: `1700000000000-InitSchema.ts`. For a clean DB: drop schema or `docker compose down -v`, then start again.

## Useful commands

```powershell
cd backend
npm run seed:admin              # first admin (once)
npm run openapi                 # write backend/openapi.json

cd frontend
npm run gen:types               # regenerate src/api/schema.ts from openapi.json
```

## Environment (backend)

Copy `backend/.env.example` → `.env`. Required: `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`.  
Production: `NODE_ENV=production`, strong JWT secrets, `ENABLE_API_DOCS=false`.
