# EventNest

EventNest is a community events board. The repository is an npm workspace with a Next.js App Router frontend and three independently runnable Fastify services backed by PostgreSQL.

## Current progress

The auth service provides signup, login, and token-protected identity endpoints. The frontend and event/preferences product APIs are still to be implemented. Each API service exposes `GET /health` for liveness and `GET /ready` for PostgreSQL readiness.

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
npm run db:migrate
npm run db:seed
```

Before starting the auth service, replace the `JWT_SECRET` and `ADMIN_PASSWORD` placeholders in `backend/.env`. Use a random JWT secret with at least 32 characters and an admin password with at least 12 characters. The configured `ADMIN_EMAIL` and `ADMIN_PASSWORD` are the admin login credentials.

The seed can be run again safely; it upserts the same 15 sample events and uses dates relative to the current day.

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
| PostgreSQL | 5432 | Shared local database; auth owns users, events owns events, preferences owns user settings |

Backend feature modules use `feature.route.js`, `feature.controller.js`, `feature.service.js`, and `feature.model.js`. Keep SQL in models, request/response handling in controllers, and business rules in services. Shared config, database pooling, migrations, health routes, security headers, CORS, and structured request logging live in `backend/shared/`.

## Database structure

- `users` stores normalized email addresses, password hashes, and member/admin roles.
- `events` stores event details, category, city, timezone-aware start time, integer paise price, active state, optional seed key, and a generated text-search document. A database trigger rejects event deletion; admins will deactivate events instead.
- `user_favourite_categories` stores a unique category per user.
- `event_reminders` stores one reminder per user and event.
- `event_card_designs` stores one theme and up to three allowlisted stickers per user and event.

Foreign keys protect references and unique keys prevent duplicate preferences. The sample seed covers all five categories, multiple Indian cities, past and upcoming dates, and active and inactive states.

## API and security notes

Auth endpoints run on port 4001:

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/auth/signup` | Create a member account and return a bearer access token. |
| `POST` | `/auth/login` | Log in a member or the configured admin and return a bearer access token. |
| `GET` | `/auth/me` | Return the current identity; requires `Authorization: Bearer <token>`. |

Signup and login accept JSON `{ "email": "person@example.com", "password": "at-least-8-characters" }`. Access tokens expire after one hour. Signup is limited to five requests per minute per process, and login to ten. Passwords are stored as salted `scrypt` hashes; the admin account is configured through environment variables and cannot be registered as a member. JWT signing uses `JWT_SECRET`, and `/auth/me` verifies the signature, issuer, and expiry. Event filtering, admin event management, and the visitor preference APIs remain to be implemented. The event browse indexes are ready for upcoming date ordering, optional category/city filters, and full-text search.

## Demo recording

The requested 3-4 minute phone and laptop walkthrough will be recorded after the user-facing flows are complete.
