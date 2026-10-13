# EventNest

EventNest is a community events board. The repository is an npm workspace with a Next.js App Router frontend and three independently runnable Fastify services backed by PostgreSQL.

## Current scaffold

This commit establishes the frontend and backend boilerplate. Product APIs, database migrations, and UI flows will be added in the next implementation steps. Every API service exposes `GET /health` as a liveness endpoint and `GET /ready` as a PostgreSQL readiness check.

## Requirements

- Node.js 20.9 or newer and npm 10 or newer.
- Docker Compose for the local PostgreSQL instance, or a compatible PostgreSQL server.

## Run locally

From the repository root:

```powershell
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env.local
docker compose up -d postgres
npm install
```

Start each process in its own terminal from the repository root:

```powershell
npm run dev
npm run dev:auth
npm run dev:events
npm run dev:preferences
```

Open <http://localhost:3000>. Check service health at `http://localhost:4001/health`, `http://localhost:4002/health`, and `http://localhost:4003/health`. The `/ready` endpoint also verifies a PostgreSQL connection. The local database credentials in the example files are for development only; replace them for any shared or deployed environment.

## Services and ports

| Workspace | Port | Responsibility |
| --- | ---: | --- |
| `frontend/` | 3000 | Next.js pages and browser API client |
| `backend/auth/` | 4001 | Signup, login, and identity |
| `backend/events/` | 4002 | Public event catalog and admin event management |
| `backend/preferences/` | 4003 | Favourite categories, feed, reminders, and card design |
| PostgreSQL | 5432 | Shared local database; tables are owned by their service |

Backend feature modules use `feature.route.js`, `feature.controller.js`, `feature.service.js`, and `feature.model.js`. Keep SQL in models, request/response handling in controllers, and business rules in services. Shared config, database pooling, health routes, security headers, CORS, and structured request logging live in `backend/shared/`.

## Environment

Copy the example files before starting. `backend/.env` contains server-only secrets and database settings. `frontend/.env.local` contains only public API base URLs; values prefixed with `NEXT_PUBLIC_` are visible to browsers. Never commit real environment files or production credentials.

## API and data notes

Only health and readiness endpoints exist in this scaffold. EventNest's product API list, admin credentials, database design explanation, filter/index explanation, password storage and authorization explanation, and any remaining work will be documented here as those features are implemented.

## Demo recording

The requested 3–4 minute phone and laptop walkthrough will be recorded after the user-facing flows are complete.
