# Digimess — Project-Wide Agent Instructions

## Overview

Digimess is a food-mess management platform with **four components** in a monorepo:

| Component | Path | Tech Stack | Port |
|-----------|------|-----------|------|
| **Backend** | `backend/` | Node.js, Express 5, MySQL (mysql2/promise), Redis, JWT, Joi | 5000 |
| **Consumer** | `consumer/` | Expo 54, React Native 0.81, TypeScript, NativeWind/TailwindCSS, Zustand | 8081 |
| **Provider** | `provider/` | Expo 55, React Native 0.83, TypeScript, Zustand, Axios-style fetch wrapper | 8082 |
| **Admin** | `admin/` | Vite, React (JSX), Vanilla CSS | 5173 |

## Architecture

```
consumer (customer app)  ──┐
provider (vendor app)    ──┤──▶ backend (REST API) ──▶ MySQL + Redis
admin    (admin panel)   ──┘
```

- **Shared database**: All apps talk to the same MySQL database via the backend API.
- **Shared auth**: JWT tokens from `/api/auth` work across all frontends. The token payload includes `{ id, phone, role }`.
- **Roles**: `customer`, `vendor`, `admin`.

## Database Conventions

- Schema: `backend/models/schema.sql`
- Primary keys: `VARCHAR(36)` UUIDs generated with `crypto.randomUUID()`
- Soft deletes: `isDeleted TINYINT(1)`, `deletedAt DATETIME`
- Timestamps: `createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP`, `updatedAt` with `ON UPDATE`
- All queries use parameterized `?` placeholders (never string interpolation)
- Connection pool defined in `backend/config/db.js`

## API Conventions

- All routes are prefixed with `/api/`
- Response format: `{ message, data }` for success, `{ error }` for errors
- HTTP status codes: `200` success, `201` created, `400` bad request, `401` unauthorized, `403` forbidden, `404` not found, `500` server error
- Auth middleware at `backend/middlewares/auth.js` — sets `req.user` from JWT
- Validation middleware at `backend/middlewares/validate.js` — uses Joi schemas from `backend/validators/`
- Error handling via `backend/middlewares/error.js`

## Key Business Rules

1. **One mess per vendor** — each vendor can only register one mess
2. **Single mess per cart** — a customer's cart can only contain items from one mess
3. **Wallet-first payments** — orders deduct from `Users.walletBalance`; subscriptions are checked before wallet
4. **Order lifecycle**: `pending → confirmed → preparing → out_for_delivery → delivered` (or `cancelled`)
5. **Fulfillment modes**: Delivery, Takeaway, Dine-In (controlled by mess settings)

## Cross-Component Conventions

- When modifying a backend endpoint, always check if the consumer, provider, or admin apps consume that endpoint and update them accordingly.
- When adding a new database column, update `backend/models/schema.sql` AND run the ALTER TABLE in the init script or migration.
- When adding a new API route, register it in `backend/server.js` and add it to the appropriate frontend service layer (`provider/src/services/api.ts` or equivalent).

## Deployment

- Docker Compose files at root: `docker-compose.yml` (production), `docker-compose.local.yml` (local)
- Domain: `rahultambare.click` — admin at `admin.rahultambare.click`, provider at `provider.rahultambare.click`
- Backend env: `backend/.env` (local), `backend/.env.production` (production)
