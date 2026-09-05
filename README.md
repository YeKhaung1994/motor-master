# motor-master

A motorcycle specification and comparison site. Filter a catalogue by brand, class,
engine size and price, open a full spec sheet, or put up to three bikes side by side
and see which one wins each row.

- `apps/web` — React 18 + Vite + React Router + TanStack Query
- `apps/api` — Node 20 + Express + TypeScript over PostgreSQL (`pg`)
- `packages/share_ui` — the design system, and the only place UI is drawn

## Prerequisites

- Node 20 or newer (developed on Node 22)
- Docker, for the local PostgreSQL container

## Getting started

```bash
npm install
cp .env.example .env

docker compose up -d db      # PostgreSQL 16, waits until healthy
npm run db:migrate           # creates the database and applies db/migrations/*.sql
npm run db:seed              # imports every catalogue in apps/api/src/db/seed/*.json
                             # (use db:seed:fresh to clear the catalogue first)
npm run dev                  # API on :4000, web on :5173
```

Open http://localhost:5173. The web dev server proxies `/api` to the API, so no
CORS setup is needed for local work.

For ports, database credentials, environment variables and troubleshooting, see
[docs/development.md](docs/development.md). For hosting it, see
[docs/deployment.md](docs/deployment.md).

Check the API on its own:

```bash
curl http://localhost:4000/api/v1/health      # {"ok":true,"db":"up"}
curl "http://localhost:4000/api/v1/bikes?sort=power_desc&pageSize=3"
curl "http://localhost:4000/api/v1/compare?ids=4,6"
```

### If port 5432 is already in use

Another Postgres may already own the default port. Set `DB_PORT` in `.env` to a
free port before `docker compose up -d db` — the compose file publishes
`${DB_PORT:-5432}` on the host and the API reads the same variable.

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

Bikes are imported from manufacturer catalogue files in `apps/api/src/db/seed/`,
one per brand per market, so a spec sheet can be re-imported without touching SQL:

```json
{
  "brand": "Honda",
  "market": "Thailand (Thai Honda Manufacturing / A.P. Honda)",
  "models": [
    {
      "model": "CBR500R",
      "model_year": 2026,
      "category": "Sport",
      "markets": ["TH", "EU"],
      "engine": "Parallel twin, liquid-cooled, DOHC",
      "displacement": 471,
      "power_hp": 47,
      "torque_nm": 43,
      "brake_f": "296mm disc, radial 4-piston, ABS",
      "msrp_thb": "THB 235,800",
      "msrp_other": { "US": "USD 6,499" },
      "source": "https://www.thaihonda.co.th/honda/"
    }
  ]
}
```

Every spec field is optional; unknown fields are ignored. The import is
idempotent — brands and models are matched on a slug derived from
`brand + model`, so a fuller sheet overwrites what is there rather than
duplicating it. Categories are created on import, which is why the class filter
is built from the database rather than a fixed list.

```bash
npm run db:seed              # import or re-import, keeping what is there
npm run db:seed:fresh        # clear every brand and bike first
```

### Prices

Real list prices are qualified prose, not numbers: `THB 69,900 / 79,900` is two
variants, `THB ~249,000 (SP)` is an approximation for one trim, and
`USD 6,499 (cut USD 1,000 for 2026)` contains a price *and* a discount. So each
price is stored twice — the source string exactly as published, which is what the
site displays, and a base figure parsed out of it for sorting and filtering.
The parser takes the first number after the currency code (never the lowest, or
that discount would become the price of the bike) and refuses to put a
`2.1 lakh` figure in a decimal column at all.

Prices from other markets go to a `BikePrices` row each, so nothing in a source
file is dropped on import.

### Model images

Photography lives in `apps/web/public/bikes/<slug>.jpg` and is resolved by
filename — the catalogue data carries no image URLs. Drop a file in, and the card
and detail page pick it up; until then they show a marked-out placeholder. A
model can still override this with an `image` field in its catalogue entry.

The images currently in the repo came from Wikimedia Commons and are mostly
CC BY-SA, which requires attribution. Credits, licences and source links are in
`apps/web/public/bikes/ATTRIBUTION.md` — keep that file with the images.

## API

Base path `/api/v1`.

| Method | Route | Query | Returns |
|---|---|---|---|
| GET | `/health` | — | `{ ok, db }` |
| GET | `/brands` | — | `[{ id, name, countryCode, slug, modelCount }]` |
| GET | `/classes` | — | `[{ name, modelCount }]`, built from imported data |
| GET | `/bikes` | `brand`, `class` (repeatable), `market`, `ccMin`, `ccMax`, `priceMin`, `priceMax`, `sort`, `page`, `pageSize` | `{ items, total, page, pageSize }` |
| GET | `/bikes/:slug` | — | bike with its full spec sheet |
| GET | `/compare` | `ids=1,3,7` (2–3) | `{ bikes, winners }` |
| GET | `/search` | `q` | up to 8 matches |

`sort` is one of `price_asc`, `price_desc`, `power_desc`, `weight_asc`.

`winners` maps a spec field to the winning bike's id, computed server-side:
highest wins for `DisplacementCc`, `PowerHp`, `TorqueNm` and `FuelTankL`; lowest
wins for `KerbWeightKg` and `Price`. A tie for the best value marks nothing, and
price is only judged when every bike quotes the same currency and none of the
figures is approximate.

A figure the manufacturer does not publish comes back as `null`, never `0`, and
renders as an em dash. Rows sort with unpublished figures last, so a bike with no
listed price never appears as the cheapest.

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
├─ db/          pool, migrations, seed.sql, seed/*.json, priceText.ts
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
