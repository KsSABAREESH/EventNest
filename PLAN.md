# EventNest Build Plan

## Goal

Build a polished Community Events Board with a Next.js App Router frontend, Fastify APIs, and PostgreSQL. Visitors can discover upcoming local events, manage their preferences, and design event cards. An administrator can sign in and manage event content and status.

## Product scope

- Admin login and server-protected admin pages and APIs.
- Create and edit events; change an event between active and inactive without deleting it.
- Public browse page with combined category, city, and text filters, nearest-event-first ordering, and pagination.
- Email/password signup and login; issue a JWT on login.
- Save favourite categories and show a personalized upcoming-event feed.
- Save per-user event reminders and per-user, per-event card theme/sticker choices.
- Seed 15 representative events spanning active/inactive, past/upcoming, categories, and cities.
- Responsive UI with loading, empty, and error states; Indian price formatting and friendly dates.
- README setup, admin credentials, API summary, database/filter/security answers, and remaining work.
- Record a 3–4 minute demo on phone and laptop layouts, including a short code-design explanation.

## Architecture

```text
frontend/                 Next.js App Router + TypeScript + Tailwind
backend/
  shared/                 config, PostgreSQL pool, logger, errors, validation
  auth/                    Fastify auth service
  events/                  Fastify event catalog/admin service
  preferences/             Fastify favourites, feed, reminders, and card design service
```

Each backend service is an independently runnable Fastify application with its own feature modules and HTTP API. The frontend calls these JSON APIs through a shared typed API client; service URLs are configurable through environment variables. Services share PostgreSQL for this small project, with clear table ownership and migrations. This keeps the requested feature boundaries real without introducing infrastructure that the app does not need.

Feature modules follow the agreed file convention:

```text
<feature>/
  <feature>.route.js       Route registration and schemas
  <feature>.controller.js  HTTP input/output handling
  <feature>.service.js     Business rules
  <feature>.model.js       Database queries only
```

Frontend routes live under `frontend/src/app`; reusable feature components live under `frontend/src/components/<feature>`. Shared API, formatting, and UI utilities live under `frontend/src/lib` and `frontend/src/components/ui`.

### Visual system

- Navbar and prominent surfaces: `#1e1d57`.
- Primary actions and emphasis borders: `#ff0905`.
- White page background; black/white text chosen for contrast.
- Inter with a sans-serif fallback.
- Tailwind tokens centralize these colors, typography, spacing, and focus states.

## Data model

- `users`: email (unique), password hash, role, timestamps.
- `events`: title, category, city, start time, price in integer paise, description, image URL, active flag, timestamps.
- `user_favourite_categories`: user and category, unique pair.
- `event_reminders`: user and event, unique pair, saved state/timestamp.
- `event_card_designs`: user and event, theme, up to three sticker values, updated timestamp, unique pair.

Foreign keys and unique constraints enforce ownership relationships and prevent duplicate preferences. Store event times as timezone-aware timestamps (seed/display consistently in India Standard Time); store money as integer paise. Seed data is repeatable and uses relative dates so upcoming/past examples remain useful when the project is run later.

## API outline

- Auth: `POST /auth/signup`, `POST /auth/login`, `GET /auth/me`.
- Events: `GET /events` (filters, page, page size), `GET /events/:id`; protected admin create/update/status endpoints.
- Preferences: read/update favourite categories and `GET /feed`.
- Reminders: read current user's reminders and add/remove a reminder for an event.
- Card design: read/save the current user's theme and sticker choices for an event.

All APIs return JSON with consistent error shapes. Validate inputs at the API boundary. Passwords use a modern password hashing function; JWT secrets, database credentials, and admin credentials come from environment configuration, never source control. Admin authorization is checked in Fastify hooks for every admin endpoint and on the server-rendered admin route boundary.

## Delivery phases

1. **Foundation and plan (complete)** — Confirm repo baseline and document this plan.
2. **Boilerplate (complete)** — Add `frontend/` and `backend/`, workspace scripts, environment examples, ignore rules, formatting/lint configuration, shared Fastify config/logger/database/error helpers, and minimal health endpoints. Keep secrets out of committed files.
3. **Database and service skeletons (complete)** — Add PostgreSQL migrations, repeatable 15-event seed, and independently runnable auth/events/preferences service skeletons with the agreed feature layout.
4. **API features** — Implement authentication and authorization, event administration/browsing, combined filters/pagination, favourites/feed, reminders, and card design persistence.
5. **Frontend** — Build the responsive pages and feature components, connect them to the JSON APIs, and implement loading/empty/error and optimistic reminder behavior.
6. **Project handoff** — Write the under-five-minute setup README and the three database/filter/security answers, document any remaining work, commit complete vertical slices regularly, and capture the requested phone/laptop screen recording.

## Working conventions and acceptance checks

- Keep frontend and backend environment values in `.env.example` files; ignore real `.env*` files while allowing examples.
- Make each service's port, database URL, JWT secret, and admin bootstrap credentials explicit and configurable.
- Use structured logging with request IDs and redact credentials, tokens, and password fields.
- Keep database queries inside feature `.model.js` files; controllers handle transport concerns and services own business rules.
- Verify the core flows manually against the acceptance criteria, including rejected unauthenticated admin requests, combined filters, persisted preferences, and refresh persistence.
- Commit after the plan, boilerplate, database/API slices, UI slices, and final handoff so the GitHub history shows progress.
