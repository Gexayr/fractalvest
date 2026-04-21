# FractionalVest — Fractional Real Estate Investment Platform

A full-stack MVP for fractional real estate investing, enabling users to buy and sell shares of real estate assets, track portfolio performance, and manage investments through a modern web interface.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [Authentication](#authentication)
- [Features](#features)
- [Docker — Quick Start](#docker--quick-start)
- [Getting Started (Local Dev)](#getting-started-local-dev)
- [Environment Variables](#environment-variables)
- [Development Commands](#development-commands)
- [Code Generation](#code-generation)

---

## Overview

FractionalVest allows users to invest in real estate properties by purchasing fractional shares. Instead of buying an entire property, users can invest any amount by acquiring shares of a listed asset, diversifying their portfolio across multiple properties.

**Core capabilities:**

- Browse and invest in fractional real estate assets
- Real-time portfolio tracking with profit/loss calculations
- Buy and sell share transactions with wallet balance management
- Dashboard with market overview and personal analytics
- Notification system for transaction confirmations and updates

---

## Tech Stack

### Backend
| Layer | Technology |
|-------|------------|
| Runtime | Node.js 24 |
| Framework | Express 5 |
| Language | TypeScript 5.9 (strict) |
| Database | PostgreSQL 16 |
| ORM | Drizzle ORM + Drizzle Kit |
| Validation | Zod v3 |
| Authentication | JWT (jsonwebtoken) + bcryptjs |
| Logging | Pino |
| Build | esbuild (ESM output) |

### Frontend
| Layer | Technology |
|-------|------------|
| Framework | React 19.1.0 |
| Build Tool | Vite |
| Styling | TailwindCSS 4 |
| Components | Radix UI |
| Forms | React Hook Form + Zod |
| Data Fetching | TanStack React Query v5 |
| Routing | Wouter |
| Charts | Recharts |
| Animations | Framer Motion |
| Icons | Lucide React |

### Shared / Tooling
| Tool | Purpose |
|------|---------|
| pnpm workspaces | Monorepo management |
| OpenAPI 3.1.0 | API contract definition |
| Orval | Auto-generate Zod schemas + React Query hooks from OpenAPI spec |
| TypeScript path aliases | Shared types across packages |

---

## Architecture

The project is a **monorepo** with a clear separation between applications and shared libraries:

```
artifacts/        ← Deployable applications
  api-server/     ← Express REST API
  invest-platform/← React SPA frontend
  mockup-sandbox/ ← UI component prototype/showcase

lib/              ← Shared libraries
  db/             ← Drizzle schema + database client
  api-spec/       ← OpenAPI specification (source of truth)
  api-zod/        ← Generated Zod schemas (from OpenAPI)
  api-client-react/ ← Generated React Query hooks (from OpenAPI)
```

**Key design principle:** The OpenAPI spec in `lib/api-spec/openapi.yaml` is the single source of truth for the API contract. All TypeScript types, Zod validators, and React Query hooks are auto-generated from it — ensuring frontend and backend stay in sync.

---

## Project Structure

```
/var/www/MVP-System/
├── artifacts/
│   ├── api-server/
│   │   └── src/
│   │       ├── index.ts              # Server entry point
│   │       ├── app.ts                # Express setup (CORS, middleware)
│   │       ├── routes/
│   │       │   ├── auth.ts           # Register, login, logout, /me
│   │       │   ├── users.ts          # User CRUD
│   │       │   ├── assets.ts         # Asset listing and details
│   │       │   ├── transactions.ts   # Buy/sell operations
│   │       │   ├── portfolio.ts      # Portfolio summary + performance
│   │       │   ├── dashboard.ts      # Dashboard metrics
│   │       │   ├── notifications.ts  # Notification management
│   │       │   └── health.ts         # /healthz
│   │       └── lib/
│   │           ├── auth.ts           # JWT middleware
│   │           └── logger.ts         # Pino logger
│   │
│   └── invest-platform/
│       └── src/
│           ├── main.tsx              # React entry point
│           ├── App.tsx               # Router + auth provider
│           ├── pages/
│           │   ├── dashboard.tsx     # Portfolio snapshot + chart
│           │   ├── assets.tsx        # Browse investments
│           │   ├── asset-detail.tsx  # Asset details + buy/sell UI
│           │   ├── portfolio.tsx     # Holdings breakdown
│           │   ├── transactions.tsx  # Transaction history
│           │   ├── notifications.tsx # Notifications list
│           │   ├── settings.tsx      # User settings
│           │   ├── login.tsx
│           │   └── register.tsx
│           ├── components/
│           │   ├── layout.tsx        # Sidebar navigation
│           │   └── ui/               # Radix-based component library
│           └── lib/
│               ├── auth.tsx          # Auth context (login/logout/user)
│               └── utils.ts
│
├── lib/
│   ├── db/
│   │   └── src/
│   │       ├── index.ts              # Drizzle client
│   │       └── schema/
│   │           ├── users.ts
│   │           ├── assets.ts
│   │           ├── transactions.ts
│   │           ├── holdings.ts
│   │           └── notifications.ts
│   ├── api-spec/
│   │   └── openapi.yaml             # OpenAPI 3.1.0 contract
│   ├── api-zod/                     # Generated Zod validators
│   └── api-client-react/            # Generated React Query hooks
│
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── package.json
```

---

## Database Schema

All tables use UUID primary keys and PostgreSQL with Drizzle ORM.

### `users`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| email | text | Unique |
| passwordHash | text | bcrypt hashed |
| firstName | text | |
| lastName | text | |
| role | enum | `user` \| `admin` |
| kycStatus | enum | `pending` \| `approved` \| `rejected` |
| walletBalance | decimal(18,6) | Default: 10,000.00 |
| createdAt / updatedAt | timestamptz | |

### `assets`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| name, description, location | text | |
| propertyType | text | |
| totalShares | integer | |
| availableShares | integer | |
| pricePerShare | decimal(18,6) | |
| totalValuation | decimal(18,6) | |
| expectedReturn | decimal(18,6) | Annual yield % |
| status | enum | `active` \| `coming_soon` \| `fully_funded` \| `closed` |
| imageUrl | text | Optional |
| amenities, documents, highlights | text[] | |

### `assetValuationHistory`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| assetId | UUID | FK → assets |
| valuation | decimal(18,6) | |
| pricePerShare | decimal(18,6) | |
| recordedAt | timestamptz | |

### `transactions`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| userId | UUID | FK → users |
| assetId | UUID | FK → assets |
| type | enum | `buy` \| `sell` |
| shares | integer | |
| pricePerShare | decimal(18,6) | |
| totalAmount | decimal(18,6) | |
| status | enum | `pending` \| `completed` \| `failed` \| `cancelled` |

### `holdings`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| userId | UUID | FK → users |
| assetId | UUID | FK → assets |
| shares | integer | Current held shares |
| totalInvested | decimal(18,6) | Total cost basis |

### `notifications`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| userId | UUID | FK → users |
| type | enum | `transaction` \| `valuation_update` \| `system` \| `kyc` |
| title | text | |
| message | text | |
| read | boolean | Default: false |

---

## API Reference

Base path: `/api`

### Authentication

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | No | Register new user |
| POST | `/auth/login` | No | Login → returns JWT token |
| POST | `/auth/logout` | No | Logout |
| GET | `/auth/me` | Yes | Get current user |

### Users

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/users/:id` | Yes | Get user by ID |
| PATCH | `/users/:id` | Yes | Update user profile |

### Assets

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/assets` | No | List assets (filters: status, type, minPrice, maxPrice) |
| GET | `/assets/featured` | No | Get 6 featured active assets |
| GET | `/assets/:id` | No | Get asset details |
| GET | `/assets/:id/valuation-history` | No | Price history for charts |
| POST | `/assets` | Yes (admin) | Create asset |

### Transactions

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/transactions` | Yes | List transactions (filters: userId, assetId, type) |
| GET | `/transactions/:id` | Yes | Get transaction details |
| POST | `/transactions` | Yes | Execute buy or sell |

### Portfolio

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/portfolio/:userId` | Yes | Portfolio summary with holdings |
| GET | `/portfolio/:userId/performance` | Yes | Performance history (period: 1w/1m/3m/6m/1y/all) |

### Dashboard

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/dashboard/summary` | Yes | Personal portfolio metrics |
| GET | `/dashboard/market-overview` | No | Market-wide statistics |
| GET | `/dashboard/recent-activity` | Yes | Recent transactions feed |

### Notifications

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/notifications` | Yes | List all notifications |
| PATCH | `/notifications/:id/read` | Yes | Mark one as read |
| PATCH | `/notifications/read-all` | Yes | Mark all as read |

### Health

| Method | Path | Description |
|--------|------|-------------|
| GET | `/healthz` | Health check |

---

## Authentication

The API uses **JWT Bearer tokens**.

- Tokens are signed with `SESSION_SECRET`, valid for **7 days**
- Payload: `{ userId: string; role: string }`
- The frontend stores the token in `localStorage` under key `fv_token`
- Protected routes require the `Authorization: Bearer <token>` header
- Passwords are hashed with bcryptjs (10 salt rounds), minimum 8 characters

---

## Features

### Investment Flow
1. User browses available assets on the Assets page
2. Selects an asset to view details, valuation history, and available shares
3. Enters the number of shares to buy — wallet balance is validated
4. On success: wallet is debited, holdings are updated, transaction is recorded, notification is created
5. User can sell shares from their holdings at any time

### Portfolio Dashboard
- Total portfolio value (current market prices)
- Total invested (cost basis)
- Total return (absolute and percentage)
- Cash balance (wallet)
- Active holdings count
- Performance chart with selectable time periods (1W / 1M / 3M / 6M / 1Y / All)

### Market Overview
- Total listed assets
- Total market cap
- Average expected annual return
- Total active investors

### Notifications
- Automatic transaction confirmations (buy/sell)
- Valuation change alerts
- KYC status updates
- System announcements
- Read/unread tracking with bulk mark-all-as-read

---

## Docker — Quick Start

The entire stack (PostgreSQL, migrations, API, frontend) runs with a single command.

### 1. Configure environment

```bash
cp .env.example .env
# Edit .env — at minimum change POSTGRES_PASSWORD and SESSION_SECRET
```

### 2. Start everything

```bash
docker-compose up -d
```

Open **http://localhost** (or the port set in `APP_PORT`).

### Container overview

| Service | Image | Role |
|---------|-------|------|
| `db` | postgres:16-alpine | PostgreSQL database |
| `migrate` | (built) node:24-alpine | Runs `drizzle-kit push --force` on first start, then exits |
| `api` | (built) node:24-alpine | Express REST API on internal port 8080 |
| `web` | (built) nginx:alpine | Serves the React SPA and proxies `/api/*` to the api container |

### Startup order

```
db (healthy) → migrate (completed) → api → web
```

Nginx is the only public-facing service. The API and database are not exposed on host ports.

### Useful commands

```bash
# View logs for all services
docker-compose logs -f

# View logs for a specific service
docker-compose logs -f api

# Rebuild and restart after code changes
docker-compose up -d --build

# Stop all containers
docker-compose down

# Stop and remove volumes (wipes database)
docker-compose down -v
```

### Docker file layout

```
docker/
├── Dockerfile.api      # Multi-stage: builds api-server → node runtime
├── Dockerfile.web      # Multi-stage: builds invest-platform → nginx
├── Dockerfile.migrate  # Runs drizzle-kit push-force and exits
└── nginx.conf          # Nginx: serves SPA + proxies /api/* to api:8080
docker-compose.yml
.dockerignore
.env.example
```

---

## Getting Started (Local Dev)

### Prerequisites

- Node.js 24+
- pnpm
- PostgreSQL 16

### Installation

```bash
pnpm install
```

### Database Setup

```bash
# Set DATABASE_URL then push schema
pnpm --filter @workspace/db run push
```

### Running in Development

```bash
# Start the API server (terminal 1)
pnpm --filter @workspace/api-server run dev

# Start the frontend (terminal 2)
pnpm --filter @workspace/invest-platform run dev
```

The API runs on port **8080** and the frontend on port **8081** by default.

---

## Environment Variables

### Docker (`.env` file)

| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_DB` | `fractionalvest` | Database name |
| `POSTGRES_USER` | `fvuser` | Database user |
| `POSTGRES_PASSWORD` | — | Database password — **must be set** |
| `SESSION_SECRET` | — | JWT signing secret — **must be set** |
| `LOG_LEVEL` | `info` | Pino log level (`trace` `debug` `info` `warn` `error`) |
| `APP_PORT` | `80` | Host port the web service is exposed on |

### Local Dev

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `PORT` | Yes | Server port (API: 8080, Frontend: 8081) |
| `BASE_PATH` | Yes | Frontend base path (e.g. `/`) |
| `SESSION_SECRET` | No | JWT signing secret (defaults to an insecure dev value) |
| `NODE_ENV` | No | `development` or `production` |

---

## Development Commands

```bash
# Type-check all packages
pnpm run typecheck

# Build everything (typecheck + compile)
pnpm run build

# Push database schema
pnpm --filter @workspace/db run push

# Run API server in dev mode
pnpm --filter @workspace/api-server run dev

# Run frontend in dev mode
pnpm --filter @workspace/invest-platform run dev

# Regenerate API client and Zod schemas from OpenAPI spec
pnpm --filter @workspace/api-spec run codegen
```

---

## Code Generation

The API contract is defined in `lib/api-spec/openapi.yaml`. After modifying the spec, regenerate the client libraries:

```bash
pnpm --filter @workspace/api-spec run codegen
```

This produces:
- `lib/api-zod/src/generated/` — Zod validation schemas for all request/response types
- `lib/api-client-react/src/generated/` — TanStack React Query hooks for every endpoint

Never edit the generated files directly — they will be overwritten on the next codegen run.