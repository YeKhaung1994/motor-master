# motor-master

A motorcycle specification and comparison site. Filter a catalogue by brand, class,
engine size and price, open a full spec sheet, or put up to three bikes side by side
and see which one wins each row.

- `apps/web` — React 18 + Vite + React Router + TanStack Query
- `apps/api` — Node 20 + Express + TypeScript over Microsoft SQL Server (`mssql`)
- `packages/share_ui` — the design system, and the only place UI is drawn

## Prerequisites

- Node 20 or newer (developed on Node 22)
- Docker, for the local SQL Server container

## Getting started

```bash
npm install
cp .env.example .env

docker compose up -d db      # SQL Server 2022, waits until healthy
npm run db:migrate           # creates the database and applies db/migrations/*.sql
npm run db:seed              # imports every catalogue in apps/api/src/db/seed/*.json
npm run dev                  # API on :4000, web on :5173
```

Open http://localhost:5173. The web dev server proxies `/api` to the API, so no
CORS setup is needed for local work.

For ports, database credentials, environment variables and troubleshooting, see
[docs/development.md](docs/development.md).

Check the API on its own:

```bash
curl http://localhost:4000/api/v1/health      # {"ok":true,"db":"up"}
curl "http://localhost:4000/api/v1/bikes?sort=power_desc&pageSize=3"
curl "http://localhost:4000/api/v1/compare?ids=4,6"
```

### If port 1433 is already in use

Another SQL Server may already own the default port. Set `DB_PORT` in `.env` to a
free port (for example `14330`) before `docker compose up -d db` — the compose file
publishes `${DB_PORT:-1433}` on the host and the API reads the same variable.

## The one rule: share_ui only

Every visual element in `apps/web` comes from `@motor-master/share_ui`. No raw
`<button>`, `<input>`, `<select>`, `<table>` or `<textarea>`, and no inline `style`
props. If a component does not exist yet, **add it to `share_ui` first**, with its
props typed, a CSS module reading from `tokens.css`, and a Storybook story — then
use it from the app.

`npm run lint` enforces this; the error names the component to reach for instead.

Pages compose share_ui components and place them with the handful of layout
classes in `apps/web/src/styles.css`. Links inside share_ui route through
`LinkProvider`, which the app wires to React Router, so the design system never
depends on the router.

### The design system

`packages/share_ui/src/tokens/tokens.css` is the single source of colour, type and
spacing. Components read the CSS variables and never hard-code a value.

Red (`--mm-red`) means exactly two things: a compare action, and the winning figure
in a comparison. It is never decorative. The only shadow in the system is the one
under the compare tray.

```bash
npm run storybook     # every component, plus a Screens group composing the pages
```

## Importing catalogue data

Bikes are seeded from one JSON file per brand in `apps/api/src/db/seed/`, so a
brand's spec sheet can be re-imported without touching SQL:

```json
{
  "brand": { "name": "Yamaha", "countryCode": "JP", "slug": "yamaha" },
  "bikes": [
    {
      "name": "MT-07",
      "slug": "yamaha-mt-07",
      "class": "Naked",
      "modelYear": 2024,
      "priceUsd": 8599,
      "imageUrl": null,
      "specs": { "displacementCc": 689, "powerHp": 73, "torqueNm": 67 }
    }
  ]
}
```

Every field under `specs` is optional. The files currently carry the headline
figures only (cc, hp, Nm, kg, seat height, tank, price); columns that are still
empty render as an em dash, and a spec row no bike has a value for is left out
entirely. Re-running `npm run db:seed` is idempotent — brands and bikes are matched
on their slug and updated in place, so a fuller import overwrites what is there
without creating duplicates.

`BikeClasses` is reference data and lives in `apps/api/src/db/seed.sql`. A class
named in a JSON file that does not exist yet is created on import.

## API

Base path `/api/v1`.

| Method | Route | Query | Returns |
|---|---|---|---|
| GET | `/health` | — | `{ ok, db }` |
| GET | `/brands` | — | `[{ id, name, countryCode, slug, modelCount }]` |
| GET | `/bikes` | `brand`, `class` (repeatable), `ccMin`, `ccMax`, `priceMin`, `priceMax`, `sort`, `page`, `pageSize` | `{ items, total, page, pageSize }` |
| GET | `/bikes/:slug` | — | bike with its full spec sheet |
| GET | `/compare` | `ids=1,3,7` (2–3) | `{ bikes, winners }` |
| GET | `/search` | `q` | up to 8 matches |

`sort` is one of `price_asc`, `price_desc`, `power_desc`, `weight_asc`.

`winners` maps a spec field to the winning bike's id, computed server-side:
highest wins for `DisplacementCc`, `PowerHp`, `TorqueNm` and `FuelTankL`; lowest
wins for `KerbWeightKg` and `PriceUsd`. A tie for the best value marks nothing.

Every query parameter is validated with zod. Failures return
`400 { error, details }` naming the field; a missing bike returns
`404 { error: "Bike not found" }`; anything unexpected returns
`500 { error: "Something went wrong" }`. SQL never reaches the client, and every
query is parameterised — including `IN` lists and `LIKE` terms.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | API and web together |
| `npm run build` | builds share_ui, the API and the web bundle |
| `npm run lint` | ESLint, including the share_ui-only rule |
| `npm run typecheck` | `tsc --noEmit` across all three packages |
| `npm run test` | Vitest: API routes against a mocked pool, share_ui render tests |
| `npm run storybook` | the design system on :6006 |
| `npm run db:migrate` / `npm run db:seed` | schema, then catalogue data |

## Layout

```
apps/api/src
├─ db/          pool, migrations, seed.sql, seed/*.json
├─ routes/      brands, bikes, compare, health
├─ services/    query logic returning typed DTOs
├─ middleware/  errorHandler, zod validate
└─ scripts/     migrate.ts, seed.ts

apps/web/src
├─ pages/       BrowsePage, BikeDetailPage, ComparePage, BrandsPage
├─ features/    bikes, brands, compare (api clients, hooks, compare store)
├─ layout/      AppShell, RouterLink
└─ lib/         fetch wrapper and DTO types

packages/share_ui/src
├─ tokens/      colors, typography, spacing, tokens.css
├─ components/  one folder per component: index.tsx, styles.module.css, story
└─ icons/
```
