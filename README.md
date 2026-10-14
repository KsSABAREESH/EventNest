# EventNest

EventNest is a community events board. The repository is an npm workspace with a Next.js App Router frontend and three independently runnable Fastify services backed by PostgreSQL.

## Current progress

The auth service provides signup, login, profile completion, and admin authentication. The events service provides public and personalized event browsing plus protected event administration. The preferences service stores favourite categories, reminders, and per-event card designs. Each API service exposes `GET /health` for liveness and `GET /ready` for PostgreSQL readiness.

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

Before starting the auth service, replace the `JWT_SECRET` and `ADMIN_PASSWORD` placeholders in `backend/.env`. Use a random JWT secret with at least 32 characters and an admin password with at least 12 characters. The default admin email is `admin@eventnest.local`; the password is the value you set as `ADMIN_PASSWORD` in that file. Sign in at `/admin/login`.

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

- `users` stores normalized email addresses, password hashes, member/admin roles, and an optional username. A member completes the first-login profile prompt when a username is set.
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
| `GET` | `/auth/me` | Return the current identity and profile-completion status; requires `Authorization: Bearer <token>`. |
| `PATCH` | `/auth/me/profile` | Save a username; requires a bearer token. |

Signup and login accept JSON `{ "email": "person@example.com", "password": "at-least-8-characters" }`. Access tokens expire after one hour. Signup is limited to five requests per minute per process, and login to ten. Passwords are stored as salted `scrypt` hashes; the admin account is configured through environment variables and cannot be registered as a member. JWT signing uses `JWT_SECRET`, and `/auth/me` verifies the signature, issuer, and expiry. After their first manual login, new members are asked for a username and favourite categories. The personalized feed uses those categories; a visitor can still discover the full event catalog without logging in. Event browse indexes support upcoming date ordering, optional category/city filters, and full-text search.

Events endpoints run on port 4002:

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/events` | Browse active, upcoming events with optional `category`, `city`, `q`, `page`, and `pageSize` query parameters. |
| `GET` | `/events/my-feed` | Browse active, upcoming events in the signed-in member's favourite categories; requires a member bearer token and accepts the same filters and pagination parameters. |

The filters combine with AND. Text search covers event title, city, and description. Results are ordered by nearest event first. Pagination defaults to 12 events per page and allows up to 50. The endpoint returns `data` and `pagination` fields; event prices are integer paise values in `pricePaise`.

Preferences endpoints run on port 4003 and require a member bearer token:

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/preferences/favourites` | Get the signed-in member's favourite categories. |
| `PUT` | `/preferences/favourites` | Replace favourite categories with `{ "categories": ["Music", "Food"] }`. |
| `GET` | `/feed` | Browse upcoming active events from favourite categories. Accepts the same category, city, text, and pagination filters as `/events`. |
| `GET` | `/reminders` | Get event IDs and event details for the member's saved reminders. |
| `PUT` | `/reminders/:eventId` | Save a reminder for an upcoming active event. |
| `DELETE` | `/reminders/:eventId` | Remove a saved reminder. |

Card design endpoints also run on port 4003 and require a member bearer token:

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/events/:eventId/card-design` | Read the member's saved theme and stickers for one event. |
| `PUT` | `/events/:eventId/card-design` | Save one of three themes and up to three stickers for that event. |
| `GET` | `/card-designs?eventIds=...` | Read saved designs for a page of event cards. |

Admin endpoints require an admin JWT. The Next.js admin pages use server-side route handlers and an HTTP-only session cookie:

| Service | Method and path | Purpose |
| --- | --- | --- |
| Auth (4001) | `POST /auth/admin/login`, `GET /auth/admin/me` | Create and validate the configured admin session. |
| Events (4002) | `GET /admin/events`, `POST /admin/events`, `PATCH /admin/events/:eventId`, `PATCH /admin/events/:eventId/status` | Search, create, update, activate, and deactivate events. Events are never deleted. |
| Auth (4001) | `GET /auth/admin/users`, `GET /auth/admin/users/:userId` | List member accounts and inspect a member profile. |
| Preferences (4003) | `GET /admin/users/:userId/favourites` | Read a member's favourite categories. |

## Required short answers

### Database structure and reason

`users` stores normalized accounts and password hashes; `events` stores event details, status, price, date, and search text.
`user_favourite_categories` and `event_reminders` link members to their interests and saved events; `event_card_designs` stores one theme and sticker list per member/event pair.
Foreign keys and unique constraints prevent invalid or duplicate rows; prices are integer paise and events are deactivated instead of deleted.

### Filter query and index

The events query combines active/upcoming conditions with optional category, case-insensitive city, and full-text search predicates using `AND`.
It sorts by start time and applies `LIMIT`/`OFFSET` pagination, while the feed adds the member's saved category set.
Partial B-tree indexes support date/category/city filters; a GIN index supports text search. `pg_trgm` indexes could speed up admin substring search.

### Passwords and admin protection

Member passwords are stored as salted `scrypt` hashes; login issues a signed, expiring JWT. Admin credentials come from environment variables, not a member row.
Admin APIs verify the admin role on the server, and admin pages check the session before rendering.
The Next.js server routes use an HTTP-only, same-site cookie when proxying admin requests to the Fastify services.

## Demo recording

Record a 3–4 minute walkthrough showing the app at phone and laptop sizes, then explain two or three implementation choices in your own words. The recording is not included in this repository yet.
