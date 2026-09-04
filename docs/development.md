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
| Docker | any current | runs SQL Server 2022 |
| sqlcmd | optional | only for querying the database by hand |

On Apple Silicon the SQL Server image is `linux/amd64` and runs under emulation.
It works, but it is slower to start and uses more memory than a native image —
see [Troubleshooting](#troubleshooting).

## First-time setup

```bash
npm install                  # from the repo root — it installs all three workspaces
cp .env.example .env

docker compose up -d db      # SQL Server 2022; wait for "healthy"
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
| 14330 | SQL Server (host side) | `docker compose up -d db` | maps to 1433 inside the container |
| 6006 | Storybook | `npm run storybook` | not started by `npm run dev` |

`DB_PORT` in `.env` controls the host database port: compose publishes
`${DB_PORT:-1433}:1433`, and the API connects to the same value. This checkout uses
**14330** because port 1433 was already taken by another SQL Server container on
this machine. A fresh clone with the shipped `.env.example` uses 1433.

Change the port in `.env`, then recreate the container so the new mapping applies:

```bash
docker compose up -d --force-recreate db
```

See what is listening right now:

```bash
lsof -nP -iTCP -sTCP:LISTEN | grep -E ':(4000|5173|6006|1433|14330) '
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
| Port | `14330` (host) → `1433` inside the container |
| User | `sa` |
| Password | `MotorMaster!2024` |
| Database | `motor_master` |
| Encrypt | on |
| Trust server certificate | on — the container uses a self-signed cert |

**From your machine:**

```bash
sqlcmd -S localhost,14330 -U sa -P 'MotorMaster!2024' -C -d motor_master
```

`-C` (trust the server certificate) is required. Without it sqlcmd fails on the
self-signed certificate chain.

**From inside the container** — the port is 1433 there, not 14330:

```bash
docker exec -it motor-master-db /opt/mssql-tools18/bin/sqlcmd \
  -S localhost -U sa -P 'MotorMaster!2024' -C -d motor_master
```

**GUI clients** (Azure Data Studio, DBeaver, TablePlus): server `localhost,14330`,
SQL Login authentication, and tick **Trust server certificate**.

Changing the password means changing it in three places that must agree:
`MSSQL_SA_PASSWORD` in `docker-compose.yml`, `DB_PASSWORD` in `.env`, and
`.env.example` for the next person. Note that SA's password is set when the data
volume is first initialised — editing compose afterwards has no effect on an
existing volume. To genuinely reset it you have to drop the data:

```bash
docker compose down -v && docker compose up -d db
npm run db:migrate && npm run db:seed
```

## Environment variables

One `.env` at the repo root configures everything; the API also reads an optional
`apps/api/.env` that overrides it.

| Variable | Default | Used for |
|---|---|---|
| `DB_SERVER` | `localhost` | SQL Server host |
| `DB_PORT` | `1433` | host port — also what compose publishes |
| `DB_NAME` | `motor_master` | created by `db:migrate` if missing |
| `DB_USER` | `sa` | required; the API refuses to start without it |
| `DB_PASSWORD` | — | required |
| `DB_ENCRYPT` | `true` | TLS to SQL Server |
| `DB_TRUST_CERT` | `true` | accept the container's self-signed cert |
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

### Model images

Images are resolved by filename from `apps/web/public/bikes/<slug>.jpg`; the
catalogue data holds no URLs. To add one, name the file after the slug — run this
to see the expected names:

```bash
curl -s "http://localhost:4000/api/v1/bikes?pageSize=60" \
  | python3 -c "import sys,json;[print(b['slug']+'.jpg') for b in json.load(sys.stdin)['items']]"
```

A model with no file shows a placeholder rather than a broken image. Credits and
licences for the images in the repo are in `apps/web/public/bikes/ATTRIBUTION.md`
— most are CC BY-SA and require attribution wherever they are published.

## Troubleshooting

**`Bind for 0.0.0.0:1433 failed: port is already allocated`**
Another SQL Server owns the port. Either stop it (`docker stop <name>`) or set a
free `DB_PORT` in `.env` and `docker compose up -d --force-recreate db`.

**Container exits with code 137**
The kernel killed it — almost always memory. Two SQL Server instances at once will
do it on a default Docker VM. Stop the one you are not using, or raise the memory
limit in Docker Desktop → Settings → Resources.

**`db:migrate` fails to connect**
The container reports healthy well after it reports running. Check
`docker compose ps` for `healthy`, and confirm `DB_PORT` in `.env` matches the host
port in `docker compose ps`.

**Certificate chain errors from sqlcmd or a GUI client**
Pass `-C`, or tick "Trust server certificate". The container's certificate is
self-signed.

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
