# motor-master — project build prompt

Paste this whole file into Claude Code (or any coding agent) from an empty folder.

---

## Role

You are a senior full-stack engineer and design-systems lead. Build the **motor-master** project: a motorcycle specification and comparison website. Work autonomously, create every file, run the code, and fix errors until `npm run dev` starts cleanly and the API returns data.

## Hard rules

1. **Monorepo**, one git repo, npm workspaces. Three packages: `apps/web` (React), `apps/api` (Node), `packages/share_ui` (shared component library).
2. **Every visual element in `apps/web` must come from `packages/share_ui`.** No raw `<button>`, `<input>`, `<table>`, or inline styles in `apps/web`. If a component doesn't exist in `share_ui`, create it there first, then use it. Enforce with an ESLint rule (`no-restricted-syntax` for JSX elements `button|input|select|table|textarea` inside `apps/web/src`).
3. **Database: Microsoft SQL Server** via the `mssql` package with parameterised queries only. No ORM required; no string-concatenated SQL.
4. TypeScript everywhere, strict mode.
5. Follow the design system in **Section 5** exactly. Do not substitute fonts, colours, or add gradients/shadows beyond what is specified.
6. Write from the buyer's perspective: labels say "Full specs", "Add to compare", "Find a dealer" — never "Submit" or system terms.

---

## 1. Repository layout

```
motor-master/
├─ package.json                  # workspaces: apps/*, packages/*; scripts: dev, build, lint, db:migrate, db:seed
├─ tsconfig.base.json
├─ .eslintrc.cjs                 # includes share_ui-only rule for apps/web
├─ .env.example
├─ README.md
├─ apps/
│  ├─ web/                       # React 18 + Vite + TypeScript + React Router 6 + TanStack Query
│  │  ├─ src/
│  │  │  ├─ pages/               # BrowsePage, BikeDetailPage, ComparePage, BrandsPage
│  │  │  ├─ features/            # bikes/, brands/, compare/ (hooks, api clients, state)
│  │  │  ├─ layout/              # AppShell (TopBar + Outlet + CompareTray)
│  │  │  ├─ lib/api.ts           # fetch wrapper, base URL from VITE_API_URL
│  │  │  └─ main.tsx
│  │  └─ vite.config.ts          # proxy /api → http://localhost:4000
│  └─ api/                       # Node 20 + Express + TypeScript
│     ├─ src/
│     │  ├─ server.ts
│     │  ├─ db/pool.ts           # mssql ConnectionPool singleton
│     │  ├─ db/migrations/       # 001_init.sql …
│     │  ├─ db/seed.sql          # 12+ bikes across 8 brands (use data in Section 4)
│     │  ├─ routes/              # brands.ts, bikes.ts, compare.ts
│     │  ├─ services/            # query logic, returns typed DTOs
│     │  ├─ middleware/          # errorHandler, validate (zod)
│     │  └─ scripts/             # migrate.ts, seed.ts
│     └─ .env.example
└─ packages/
   └─ share_ui/                  # the design system — see Section 5
      ├─ src/
      │  ├─ tokens/              # colors.ts, typography.ts, spacing.ts, tokens.css (CSS variables)
      │  ├─ components/          # one folder per component, each with index.tsx, styles.module.css, *.stories.tsx
      │  ├─ icons/
      │  └─ index.ts             # barrel export
      ├─ package.json            # name: "@motor-master/share_ui"
      └─ vite.config.ts          # library build (ESM + CJS + types)
```

---

## 2. Database (MSSQL)

`001_init.sql`:

```sql
CREATE TABLE Brands (
  BrandId      INT IDENTITY PRIMARY KEY,
  Name         NVARCHAR(80)  NOT NULL UNIQUE,
  CountryCode  CHAR(2)       NOT NULL,
  Slug         NVARCHAR(80)  NOT NULL UNIQUE
);

CREATE TABLE BikeClasses (
  ClassId INT IDENTITY PRIMARY KEY,
  Name    NVARCHAR(40) NOT NULL UNIQUE      -- Naked, Sport, Adventure, Cruiser, Scooter
);

CREATE TABLE Bikes (
  BikeId        INT IDENTITY PRIMARY KEY,
  BrandId       INT NOT NULL REFERENCES Brands(BrandId),
  ClassId       INT NOT NULL REFERENCES BikeClasses(ClassId),
  Name          NVARCHAR(120) NOT NULL,
  Slug          NVARCHAR(140) NOT NULL UNIQUE,
  ModelYear     SMALLINT      NOT NULL,
  PriceUsd      DECIMAL(10,2) NOT NULL,
  ImageUrl      NVARCHAR(400) NULL,
  CreatedAt     DATETIME2 DEFAULT SYSUTCDATETIME()
);

CREATE TABLE BikeSpecs (               -- one row per bike, wide table for fast compare
  BikeId          INT PRIMARY KEY REFERENCES Bikes(BikeId) ON DELETE CASCADE,
  Engine          NVARCHAR(200),
  DisplacementCc  INT,
  PowerHp         DECIMAL(6,1),
  TorqueNm        DECIMAL(6,1),
  Transmission    NVARCHAR(120),
  FrontSuspension NVARCHAR(200),
  RearSuspension  NVARCHAR(200),
  Brakes          NVARCHAR(200),
  Tyres           NVARCHAR(80),
  WheelbaseMm     INT,
  KerbWeightKg    DECIMAL(6,1),
  SeatHeightMm    INT,
  FuelTankL       DECIMAL(5,1),
  RiderAids       NVARCHAR(200),
  Display         NVARCHAR(80)
);

CREATE INDEX IX_Bikes_Brand ON Bikes(BrandId);
CREATE INDEX IX_Bikes_Class ON Bikes(ClassId);
CREATE INDEX IX_Bikes_Price ON Bikes(PriceUsd);
```

Connection via `.env`: `DB_SERVER`, `DB_PORT=1433`, `DB_NAME=motor_master`, `DB_USER`, `DB_PASSWORD`, `DB_ENCRYPT=true`, `DB_TRUST_CERT=true` (local dev). Include a `docker-compose.yml` with `mcr.microsoft.com/mssql/server:2022-latest` for local development.

---

## 3. API contract (Express, prefix `/api/v1`)

| Method | Route | Query / body | Returns |
|---|---|---|---|
| GET | `/brands` | — | `[{ id, name, countryCode, slug, modelCount }]` |
| GET | `/bikes` | `brand`, `class[]`, `ccMin`, `ccMax`, `priceMin`, `priceMax`, `sort` (`price_asc\|price_desc\|power_desc\|weight_asc`), `page`, `pageSize` | `{ items: BikeCard[], total, page, pageSize }` |
| GET | `/bikes/:slug` | — | `BikeDetail` (bike + full specs) |
| GET | `/compare` | `ids=1,3,7` (2–3 ids) | `{ bikes: BikeDetail[], winners: { [field]: bikeId } }` |
| GET | `/search` | `q` | `[{ id, name, brand, slug }]` (max 8) |
| GET | `/health` | — | `{ ok: true, db: "up" }` |

- `BikeCard` = `{ id, slug, name, brand, class, cc, hp, kg, priceUsd, imageUrl }`.
- `winners` is computed server-side: highest wins for `DisplacementCc, PowerHp, TorqueNm, FuelTankL`; lowest wins for `KerbWeightKg, PriceUsd`.
- Validate all query params with zod; return `400 { error, details }` on failure, `404 { error: "Bike not found" }`, `500 { error: "Something went wrong" }`. Errors never expose SQL.
- Enable CORS for `http://localhost:5173`, `helmet`, `compression`, request logging with `pino-http`.

---

## 4. Seed data

Seed at least these 12 bikes (fill remaining spec columns with realistic manufacturer-sheet values):

| Brand (CC) | Model | Class | cc | hp | Nm | kg | Seat | Tank | Price |
|---|---|---|---|---|---|---|---|---|---|
| Honda (JP) | CB650R | Naked | 649 | 94 | 63 | 208 | 810 | 15.4 | 9399 |
| Honda | CRF300L | Adventure | 286 | 27 | 26 | 142 | 880 | 7.8 | 5749 |
| Honda | Rebel 500 | Cruiser | 471 | 46 | 43 | 191 | 690 | 11.2 | 6499 |
| Yamaha (JP) | MT-07 | Naked | 689 | 73 | 67 | 184 | 805 | 14 | 8599 |
| Yamaha | Ténéré 700 | Adventure | 689 | 73 | 68 | 205 | 875 | 16 | 10799 |
| Kawasaki (JP) | Z900 | Naked | 948 | 125 | 98 | 212 | 820 | 17 | 9999 |
| Kawasaki | Ninja 400 | Sport | 399 | 45 | 38 | 168 | 785 | 14 | 5299 |
| Ducati (IT) | Monster 937 | Naked | 937 | 111 | 93 | 188 | 820 | 14 | 12995 |
| BMW (DE) | R 1300 GS | Adventure | 1300 | 145 | 149 | 237 | 850 | 19 | 18895 |
| Triumph (UK) | Trident 660 | Naked | 660 | 81 | 64 | 190 | 805 | 14 | 8595 |
| KTM (AT) | 390 Duke | Naked | 399 | 45 | 39 | 165 | 820 | 15 | 5899 |
| Royal Enfield (IN) | Himalayan 450 | Adventure | 452 | 40 | 40 | 196 | 825 | 17 | 5799 |

---

## 5. Design prompt — `packages/share_ui`

### 5.1 Intent

motor-master should feel like a well-organised workshop parts catalogue, not a SaaS dashboard. Cold steel greys, one racing-red accent used only for *compare* actions and *winning* spec values, condensed motorsport type for numbers. Big numbers do the talking; chrome stays quiet.

### 5.2 Tokens (`tokens.css` — every component reads from these)

```css
:root {
  --mm-bg:      #EEF0F2;   /* page */
  --mm-panel:   #FFFFFF;   /* cards, tables */
  --mm-ink:     #1B1F23;   /* text, primary buttons, compare tray */
  --mm-tyre:    #2B3036;   /* top bar, table header band */
  --mm-steel:   #AEB5BC;   /* secondary text */
  --mm-line:    #D5DAE0;   /* borders, rules */
  --mm-muted:   #4B535B;   /* body-secondary text */
  --mm-red:     #C8102E;   /* compare + winner ONLY */

  --mm-font-display: "Barlow Condensed", Impact, sans-serif;
  --mm-font-body:    "Barlow", system-ui, sans-serif;
  --mm-text-xs: 12px; --mm-text-sm: 13px; --mm-text-md: 15px; --mm-text-lg: 17px;
  --mm-display-sm: 22px; --mm-display-md: 34px; --mm-display-lg: 52px; --mm-display-xl: 64px;

  --mm-space-1: 4px; --mm-space-2: 8px; --mm-space-3: 12px; --mm-space-4: 16px;
  --mm-space-5: 20px; --mm-space-6: 28px; --mm-space-8: 44px;
  --mm-radius: 3px;
  --mm-focus: 3px solid var(--mm-red);
  --mm-tray-shadow: 0 -8px 30px rgba(0,0,0,.25);   /* the only shadow in the system */
}
```

Load Barlow + Barlow Condensed from Google Fonts in `apps/web/index.html`.

Forbidden: gradients as decoration, card drop-shadows, all-caps labels, eyebrow labels, numbered "01/02/03" markers, `→` appended to button text, emoji.

### 5.3 Components to build (each: props typed, CSS module, Storybook story, keyboard-accessible, `prefers-reduced-motion` respected)

**Primitives**
- `Button` — variants `primary` (ink), `ghost` (outlined ink), `danger`/`compare` (red); sizes `md`, `sm`; `disabled` at 45% opacity.
- `IconButton`
- `Select` — used in Quick compare; native `<select>` styled, chevron on the right.
- `Checkbox` — 15 px square, ink fill when checked.
- `SearchInput` — dark variant for the top bar with placeholder `Search model, e.g. "CB650R"`.
- `Badge` — ink background, 11 px, used for bike class.
- `Stat` — condensed number + unit + small label. Props: `value`, `unit`, `label`, `size` (`sm` 22 px for cards, `lg` 28 px for detail).
- `Text`, `Heading` — Heading always uses display font; levels map to the display scale.
- `Divider`, `Skeleton`, `EmptyState` (headline + one action, no illustration).

**Layout**
- `TopBar` — 60 px, `--mm-tyre`; slots: logo, nav links (active = red underline), search.
- `Logo` — red skewed 14×26 px bar + "motor-master" in Barlow Condensed 800.
- `PageContainer` — 28 px horizontal padding, max-width 1440 px.
- `SidebarLayout` — 230 px sticky rail + content; stacks under 860 px.

**Domain**
- `BrandRail` — list of `BrandRailItem` (name, country code, count); active item has 3 px red left border + white bg.
- `FilterGroup` — heading + Checkbox list.
- `Toolbar` — heading, count, sort Select.
- `BikeCard` — art area with `Badge`, brand, model `Heading`, three `Stat`s (cc/hp/kg), price, footer with **Full specs** | **+ Compare**. Prop `selected` turns border red and second button into red "✓ Added".
- `BikeGrid` — responsive `auto-fill, minmax(270px, 1fr)`, gap 18 px.
- `HeroCompareBox` — panel with two `Select`s, a third empty `Select`, and a `Button` "Compare these".
- `KeyStats` — 4-up grid of `Stat size="lg"` on `--mm-bg` tiles.
- `SpecTable` — dark header band (`--mm-tyre`), grouped rows (`SpecGroup` heading in display font on `--mm-bg`), label column 36 % in `--mm-muted`. Supports 1–3 value columns.
- `CompareTable` — `SpecTable` with `winners` map; winning cell gets `--mm-red` + weight 600. Column header shows model name (display 20 px) + brand · class (13 px muted).
- `CompareTray` — fixed bottom, `--mm-ink`, slides up 250 ms; three `CompareSlot`s (dashed when empty, solid with model + brand · price when filled, × to remove); "Clear" text link; red `Button` "Compare N bikes" disabled below 2.
- `BackLink` — "← Back to {context}".
- `WinnerLegend` — red square + "Red marks the best figure in each row".
- `Footer`.

### 5.4 Copy rules baked into components

- Sentence case everywhere.
- Button label names the outcome and stays constant through the flow ("Add to compare" → tray shows the bike; "Compare 3 bikes" → table shows 3 bikes).
- Empty slot text: `Slot 2 — add a bike`.
- Prices render as `$9,399` with helper `MSRP, before on-road costs` on detail pages.
- Errors: state what happened and what to do — `Couldn't load bikes. Check your connection and try again.`

### 5.5 Storybook

Add Storybook to `packages/share_ui` with a story per component plus one "Screens" story group that composes BrowsePage, BikeDetailPage and ComparePage from share_ui components only, using the seed data as fixtures.

---

## 6. Pages (`apps/web`) — compose from share_ui only

| Route | Page | Composition |
|---|---|---|
| `/` | BrowsePage | TopBar · Hero (Heading, Text, Buttons, HeroCompareBox) · SidebarLayout(BrandRail + FilterGroups, Toolbar + BikeGrid) · CompareTray |
| `/brands/:slug` | BrowsePage with brand preset | same |
| `/bikes/:slug` | BikeDetailPage | BackLink · image + Heading · price · KeyStats · Buttons · SpecTable |
| `/compare?ids=` | ComparePage | BackLink · Toolbar · CompareTable · WinnerLegend |

Compare selection lives in a `useCompare` store (zustand) and is mirrored to the URL `ids=` param so links are shareable. Max 3 ids.

---

## 7. Quality floor

- `npm run lint` passes; ESLint blocks raw HTML form/table elements in `apps/web`.
- `npm run test` — Vitest: API route tests with a mocked pool; share_ui render tests for Button, BikeCard, CompareTable winner highlighting.
- Lighthouse accessibility ≥ 95: visible focus rings, labelled inputs, table headers, colour contrast ≥ 4.5:1 (red on white passes; never put red text on `--mm-tyre`).
- README explains: prerequisites, `docker compose up db`, `npm run db:migrate && npm run db:seed`, `npm run dev`, and the "share_ui only" rule.

## 8. Delivery order

1. Root workspace + tooling → 2. `share_ui` tokens and primitives → 3. `share_ui` domain components + Storybook → 4. API + MSSQL migrations + seed → 5. `apps/web` pages → 6. Tests, lint, README. Commit after each step with a conventional-commit message.

When finished, print the tree of created files and the commands to run.
