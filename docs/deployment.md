# Deploying motor-master on free tiers

Three pieces to host: a Postgres-or-SQL-Server database, a Node API, and a static
web bundle. Two of the three are easy and free. The database is the decision.

> Free-tier terms change often. Treat the specifics below as a starting point and
> check the current limits before committing.

## The one real obstacle: SQL Server

The build targets Microsoft SQL Server, and there is no widely available free
managed SQL Server. That leaves two routes.

### Route A — stay on SQL Server (no code changes)

**Azure SQL Database**, free offer: roughly 100,000 vCore-seconds of compute and
32 GB storage per month, on a serverless tier that auto-pauses when idle. The
`mssql` driver connects unchanged; the catalogue is 227 rows, so storage is a
non-issue.

What it costs you:
- An Azure account with a card on file, even for the free offer.
- Auto-pause means the first query after idle waits for a resume — seconds, not
  milliseconds. The pool already retries rather than caching a failed connection,
  so this recovers on its own.
- Once the monthly compute allowance is gone the database stops until the next
  month unless you enable paid overage.

### Route B — port to Postgres (recommended)

Free Postgres is genuinely free and plentiful: **Neon** (serverless, autosuspend)
or **Supabase**. No card, no monthly compute cliff.

The port is small but real. The SQL that is SQL Server-specific:

| Construct | Uses | Postgres equivalent |
|---|---|---|
| `MERGE ... WHEN MATCHED` | 4 | `INSERT ... ON CONFLICT (slug) DO UPDATE` |
| `INT IDENTITY` | 3 | `GENERATED ALWAYS AS IDENTITY` or `serial` |
| `SYSUTCDATETIME()` | 2 | `now() at time zone 'utc'` |
| `DBCC CHECKIDENT ... RESEED` | 2 | `ALTER SEQUENCE ... RESTART` |
| `OFFSET @offset ROWS FETCH NEXT` | 1 | `LIMIT ... OFFSET ...` |
| `SELECT TOP (8)` | 1 | `LIMIT 8` |
| `COUNT(*) OVER ()` | 1 | identical, no change |

Plus the driver: `pool.request().input(name, type, value).query(...)` becomes
`pool.query(text, values)` with `$1` placeholders. Every query is already
parameterised, so this is mechanical — the shape is the same, only the binding
syntax changes. Budget half a day, most of it in `seed.ts`.

The win is a database that never sleeps on a schedule you cannot control, and no
card on file.

## API hosting

The API is a plain Node server. It reads `PORT` from the environment and listens
on all interfaces, so it drops onto any platform-as-a-service unchanged.

**Render** free web service is the simplest fit: connect the repo, set the build
and start commands, add environment variables. It sleeps after ~15 minutes idle
and cold-starts on the next request, which for a spec catalogue is acceptable.
**Koyeb** and **Fly.io** are alternatives; Fly's free allowance is now trial
credit rather than a standing tier.

```
Build command:  npm ci && npm run build --workspace @motor-master/api
Start command:  node apps/api/dist/server.js
Health check:   /api/v1/health
```

Environment variables:

```
DB_SERVER, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
DB_ENCRYPT=true
DB_TRUST_CERT=false          # a managed database presents a real certificate
PORT                          # supplied by the platform
WEB_ORIGIN=https://<your-web-host>   # exact origin, no trailing slash
LOG_LEVEL=info
```

`DB_USER` and `DB_PASSWORD` are required — the API refuses to start without them
rather than failing later at the first query.

## Web hosting

A Vite SPA — static files, free almost anywhere. **Cloudflare Pages**, **Netlify**
and **Vercel** all work.

```
Build command:     npm ci && npm run build --workspace @motor-master/web
Output directory:  apps/web/dist
```

Two things it needs:

**A single-page fallback.** The app owns six client-side routes (`/brands/:slug`,
`/bikes/:slug`, `/compare`, `/credits`, and a catch-all). Without a rewrite,
opening one of those directly returns the host's 404 instead of the app.

- Cloudflare Pages: a `_redirects` file containing `/*  /index.html  200`
- Netlify: the same `_redirects` file
- Vercel: `{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }`

**An absolute API URL.** `VITE_API_URL` defaults to `/api/v1`, which only works
when something proxies it — true in local development, false once the API lives
on another origin.

```
VITE_API_URL=https://<your-api-host>/api/v1
```

It is baked in at build time, so changing it means rebuilding.

## Order of operations

1. Create the database, note its host, name, user and password.
2. From your machine, point `.env` at it and run `npm run db:migrate` then
   `npm run db:seed`. There is no migration step in the API's start command, and
   deliberately so — schema changes should be a decision, not a side effect of a
   deploy.
3. Deploy the API. Confirm `GET /api/v1/health` returns `{"ok":true,"db":"up"}`.
4. Deploy the web bundle with `VITE_API_URL` pointing at the API.
5. Set `WEB_ORIGIN` on the API to the web origin and redeploy it, so CORS allows
   the browser through.

## Things that will bite

**The committed development password.** `MotorMaster!2024` is in
`docker-compose.yml` and `.env.example` in a public repository. It is a throwaway
for a local container, but do not reuse it for a hosted database — set a fresh
secret in the platform's environment settings, never in the repo.

**Cold starts compound.** A sleeping API plus an auto-paused database means the
first visitor after a quiet period waits for both. Hitting `/api/v1/health` on a
schedule keeps the API warm; the database still resumes on its own terms.

**135 MB of images.** They ship inside the web bundle at
`apps/web/public/bikes/`. That is within Cloudflare Pages and Netlify limits, but
it is a large deploy and a large repository. Converting to WebP at ~1200 px would
cut it to roughly 15–20 MB, or move them to object storage (Cloudflare R2 has a
free tier) and serve by URL — `bikeImageSrc()` in `apps/web/src/lib/images.ts` is
the single place that decides where an image comes from.

**Serverless is the wrong shape for this API.** Express plus a connection pool
expects a long-lived process. On a function platform each invocation risks a new
pool and the database's connection limit disappears fast. Use a container or a
long-running Node service.

**CORS is exact.** `WEB_ORIGIN` must match the browser's origin character for
character — scheme, host, no trailing slash. A mismatch fails only in the
browser, so the API will look healthy while every page shows an error.
