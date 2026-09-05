# Development guide

Everything needed to run motor-master locally: setup, ports, database credentials
and the fixes for the problems you are most likely to hit.

- [Prerequisites](#prerequisites)
- [First-time setup](#first-time-setup)
- [Running the app](#running-the-app)
- [Ports](#ports)
- [Database credentials](#database-credentials)
- [Environment variables](#environment-variables)
- [Common tasks](#common-tasks)
- [Importing catalogue data](#importing-catalogue-data)
- [Troubleshooting](#troubleshooting)

## Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Node | 20+ | developed on 22.22 |
| npm | 10+ | workspaces are used, so install from the repo root only |
| Docker | any current | runs PostgreSQL 16 |
| psql | optional | only for querying the database by hand |

Postgres runs natively on Apple Silicon, so there is no emulation and no memory
tuning to think about.

## First-time setup

```bash
npm install                  # from the repo root — it installs all three workspaces
cp .env.example .env

docker compose up -d db      # PostgreSQL 16; wait for "healthy"
npm run db:migrate           # creates the motor_master database, applies migrations
npm run db:seed              # imports apps/api/src/db/seed/*.json
```

Check the container is ready before migrating:

```bash
docker compose ps            # STATUS should read "healthy", not "starting"
```

## Running the app

```bash
npm run dev
```

That starts the API and the web dev server together (via `concurrently`, labelled
`[api]` and `[web]`). Open **http://localhost:5173**.

The web dev server proxies `/api` to the API, so there is no CORS setup for local
work. Both processes hot-reload: `tsx watch` for the API, Vite HMR for the web app
and for `share_ui` — the app aliases the design system to its source, so component
edits appear without a rebuild.

Run one side on its own:

```bash
npm run dev:api
npm run dev:web
npm run storybook            # the design system, on :6006
```

## Ports

| Port | Service | Started by | Notes |
|---|---|---|---|
| 5173 | web (Vite dev server) | `npm run dev` | the app — open this one |
| 4000 | API (Express) | `npm run dev` | `/api/v1`; also reachable through the web proxy |
| 5432 | PostgreSQL (host side) | `docker compose up -d db` | maps to 5432 inside the container |
| 6006 | Storybook | `npm run storybook` | not started by `npm run dev` |

`DB_PORT` in `.env` controls the host database port: compose publishes
`${DB_PORT:-5432}:5432`, and the API connects to the same value. Change it if
another Postgres already owns 5432 on your machine.

Change the port in `.env`, then recreate the container so the new mapping applies:

```bash
docker compose up -d --force-recreate db
```

See what is listening right now:

```bash
lsof -nP -iTCP -sTCP:LISTEN | grep -E ':(4000|5173|6006|5432) '
docker compose ps
curl -s http://localhost:4000/api/v1/health     # {"ok":true,"db":"up"}
```

Stop everything:

```bash
pkill -f "tsx watch src/server.ts"; pkill -f vite
docker compose stop db        # `down` also removes the container; `down -v` drops the data
```

## Database credentials

Local development only. This is a throwaway password committed to
`.env.example` and `docker-compose.yml` on purpose, so a fresh clone runs without
setup. Do not reuse it anywhere real.

| Field | Value |
|---|---|
| Host | `localhost` |
| Port | `5432` |
| User | `motor_master` |
| Password | `motor_master_dev` |
| Database | `motor_master` |
| TLS | off locally (`DB_SSL=false`); required by managed providers |

**From inside the container** (no local client needed):

```bash
docker exec -it motor-master-db psql -U motor_master -d motor_master
```

**From your machine**, with `psql` installed:

```bash
psql "postgresql://motor_master:motor_master_dev@localhost:5432/motor_master"
```

**GUI clients** (TablePlus, DBeaver, pgAdmin): host `localhost`, port `5432`,
user and database `motor_master`, no TLS.

Changing the password means changing `POSTGRES_PASSWORD` in `docker-compose.yml`
and `DB_PASSWORD` in `.env` together. Postgres sets the password when the data
volume is first initialised, so an existing volume keeps the old one:

```bash
docker compose down -v && docker compose up -d db
npm run db:migrate && npm run db:seed
```

## Environment variables

One `.env` at the repo root configures everything; the API also reads an optional
`apps/api/.env` that overrides it.

| Variable | Default | Used for |
|---|---|---|
| `DATABASE_URL` | — | full connection string; wins over the fields below, so setting it points every command at that database |
| `DB_HOST` | `localhost` | Postgres host |
| `DB_PORT` | `5432` | host port — also what compose publishes |
| `DB_NAME` | `motor_master` | created by `db:migrate` if missing |
| `DB_USER` | `motor_master` | required; the API refuses to start without it |
| `DB_PASSWORD` | — | required |
| `DB_SSL` | `false` | TLS; `true` for managed Postgres |
| `PORT` | `4000` | API port |
| `WEB_ORIGIN` | `http://localhost:5173` | the CORS allow-list entry |
| `LOG_LEVEL` | `info` | pino level |
| `VITE_API_URL` | `/api/v1` | API base the browser calls; the proxy handles the rest |

`.env` is git-ignored. `.env.example` is committed — update it whenever you add a
variable.

## Common tasks

| Command | What it does |
|---|---|
| `npm run lint` | ESLint, including the share_ui-only rule |
| `npm run typecheck` | `tsc --noEmit` across all three workspaces |
| `npm run test` | Vitest: API routes against a mocked pool, share_ui render tests |
| `npm run build` | builds share_ui, then the API, then the web bundle |
| `npm run db:migrate` | applies unapplied files from `apps/api/src/db/migrations/` |
| `npm run db:seed` | re-imports every catalogue; safe to re-run |
| `npm run db:seed:fresh` | clears every brand and bike, then imports |
| `npm run db:setup:supabase` | points a Supabase database at the catalogue end to end |
| `npm run test:e2e` | Playwright browser tests (API stubbed, no database needed) |
| `npm run storybook` | the design system on :6006 |

Migrations are tracked in a `SchemaMigrations` table, so `db:migrate` only applies
what is new. Add a migration as `002_*.sql` in the migrations folder — files run in
filename order, each inside a transaction.

Reset the database completely:

```bash
docker compose down -v
docker compose up -d db
npm run db:migrate && npm run db:seed:fresh
```

To reload the catalogue without touching the container, `npm run db:seed:fresh`
is enough — it clears brands and bikes (specs, markets and prices cascade) and
re-imports from `apps/api/src/db/seed/`.

Poke at the API directly:

```bash
curl http://localhost:4000/api/v1/health
curl "http://localhost:4000/api/v1/bikes?sort=power_desc&pageSize=3"
curl "http://localhost:4000/api/v1/bikes/yamaha-mt-07"
curl "http://localhost:4000/api/v1/compare?ids=4,6"
curl "http://localhost:4000/api/v1/search?q=CB"
```

## Importing catalogue data

Catalogue files live in `apps/api/src/db/seed/`, one per brand per market:
`{ brand, market, models[] }`. Five Thai-market sheets are imported today:

| File | Brand | Models |
|---|---|---|
| `honda-thailand.json` | Honda | 41 |
| `yamaha-thailand.json` | Yamaha | 29 |
| `ducati-thailand.json` | Ducati | 26 |
| `harley-davidson-thailand.json` | Harley-Davidson | 16 |
| `royal-enfield-thailand.json` | Royal Enfield | 13 |

```bash
npm run db:seed          # import or re-import, keeping existing rows
npm run db:seed:fresh    # clear every brand and bike first
```

Field names follow the source sheet: `model`, `model_year`, `category`,
`markets`, `engine`, `displacement`, `power_hp`, `power_kw`, `power_rpm`,
`torque_nm`, `torque_rpm`, `bore_stroke_mm`, `compression`, `fuel_system`,
`transmission`, `clutch`, `final_drive`, `frame`, `susp_f`, `susp_r`, `brake_f`,
`brake_r`, `tyre_f`, `tyre_r`, `wheelbase_mm`, `seat_height_mm`,
`ground_clearance_mm`, `weight_kg`, `fuel_l`, `wmtc`, `battery_kwh`, `range_km`,
`charging`, `variants`, `notes`, `flags`, `source`, `price_source`, `image`,
`msrp_thb`, `msrp_other`.

Everything except `model`, `model_year` and `category` is optional, and unknown
fields are ignored — a partial sheet imports fine and a fuller one can be
re-imported over it. Slugs are derived from `brand + model`, so re-importing
updates in place instead of duplicating.

The brand's country is taken from `brand_country_code` if the file states one,
otherwise from a small table of manufacturer head offices in `seed.ts`.

`source` and `price_source` are kept apart, because a Thai list price often comes
from a dealer or aggregator page while the spec sheet is the manufacturer's. The
detail page credits each separately.

### How prices are stored

A published price is kept twice: `PriceText` is the source string shown on the
site, and `PriceAmount` is a base figure parsed from it for sorting. The parser
takes the first number after the currency code — taking the lowest would read
"USD 6,499 (cut USD 1,000 for 2026)" as a $1,000 motorcycle — and declines to
parse magnitudes like "INR ~2.1 lakh" at all, keeping the text instead. Other
markets' prices each get a `BikePrices` row.

### Data provenance

Each catalogue states a `generated` date, imported to `Bikes.DataGeneratedAt` and
shown as "Specifications as recorded on ...". Roughly half the models arrive with
a `flags` caveat; that is shown on the card ("Some figures provisional"), as a
row in the comparison, and in full on the detail page. `source` and
`price_source` are credited separately because 82% of Thai prices come from a
third-party listing rather than the manufacturer.

The point is that a reader can tell how old and how solid a figure is at the
moment they are comparing it, not only if they go looking.

### Model images

Images are resolved by filename from `apps/web/public/bikes/<slug>.jpg`; the
catalogue data holds no URLs. To add one, name the file after the slug — run this
to see the expected names:

```bash
curl -s "http://localhost:4000/api/v1/bikes?pageSize=60" \
  | python3 -c "import sys,json;[print(b['slug']+'.jpg') for b in json.load(sys.stdin)['items']]"
```

A model with no file shows a placeholder rather than a broken image.

Most photography is CC BY-SA, which requires the credit to travel with the work,
so it is shown in the product: under the photo on each detail page, and in full
at `/credits`. `apps/web/public/bikes/credits.json` is the source for both, and
`ATTRIBUTION.md` mirrors it for anyone reading the repository.
`rejected.json` pins photo/model pairings judged wrong so a later run cannot
reinstate them.

Run `python3` over `credits.json` and the seed directory to reconcile the record
against what is actually on disk after any bulk image run.

## Troubleshooting

**`Bind for 0.0.0.0:5432 failed: port is already allocated`**
Another Postgres owns the port. Either stop it (`docker stop <name>`) or set a
free `DB_PORT` in `.env` and `docker compose up -d --force-recreate db`.

**Container exits unexpectedly**
Check `docker compose logs db`. Postgres is far lighter than the SQL Server image
this replaced, which was routinely killed for memory on a default Docker VM.

**`db:migrate` fails to connect**
The container reports healthy well after it reports running. Check
`docker compose ps` for `healthy`, and confirm `DB_PORT` in `.env` matches the host
port in `docker compose ps`.

**TLS errors against a managed provider**
Set `DB_SSL=true`. Neon, Supabase and RDS all require it; a local container does
not offer it at all.

**`Missing required environment variable DB_USER`**
There is no `.env`. Run `cp .env.example .env`.

**ESLint rejects a raw `<button>` / `<input>` / `<select>` / `<table>`**
Working as intended — `apps/web` may only use `share_ui` components. Add the
component to `packages/share_ui` first (typed props, a CSS module reading from
`tokens.css`, and a story), then use it. The error message names the component to
reach for.

**Blank page with "Maximum update depth exceeded"**
A zustand selector is building a new object or array on every render. Select the
stored value itself and derive with `useMemo`, as `BrowsePage` does with
`compareBikes`.

**Port 5173 or 4000 already in use**
`lsof -nP -iTCP:5173 -sTCP:LISTEN` to find the owner. A previous `npm run dev` left
running is the usual culprit: `pkill -f vite; pkill -f "tsx watch src/server.ts"`.
