# Deploying motor-master on free tiers

Three pieces to host: a Postgres-or-SQL-Server database, a Node API, and a static
web bundle. Two of the three are easy and free. The database is the decision.

> Free-tier terms change often. Treat the specifics below as a starting point and
> check the current limits before committing.

## The database

The API runs on PostgreSQL, so every free Postgres tier is open to it:
**Neon** (serverless, autosuspends when idle) or **Supabase**. No card required,
and the catalogue is 227 rows — storage is never the constraint.

Set `DB_SSL=true` for any of them; managed Postgres requires TLS and a local
container does not offer it.

### Supabase, scripted

```bash
npm run db:setup:supabase -- 'postgresql://postgres.<ref>:<password>@<host>:5432/postgres'
```

Take the string from **Project Settings → Database → Connection string → URI**.
The script checks the connection, applies the schema, imports the catalogues,
verifies the row counts, and prints the environment variables the API and web
hosts need. It is safe to re-run — migrations are tracked and the import matches
on slug, so nothing duplicates. `FRESH=1` clears the catalogue first.

Afterwards it offers to write the string into `.env`, so later commands need no
argument:

```bash
npm run db:setup:supabase     # reads DATABASE_URL from .env
npm run db:migrate            # so do these
npm run db:seed
```

`.env` is git-ignored, so the string stays on your machine. Be aware of what it
changes: `DATABASE_URL` overrides the `DB_*` fields, so with it set **every local
command talks to Supabase rather than the container**, `npm run dev` included.
Comment the line out to go back to local.

Three Supabase specifics it handles for you:

- **The direct connection is IPv6-only.** `db.<ref>.supabase.co` publishes only
  an AAAA record, so on a network without IPv6 it cannot resolve — and the error,
  `ENOTFOUND`, reads like a typo rather than an addressing problem. Use a pooler
  host (`aws-0-<region>.pooler.supabase.com`), which answers on IPv4. The script
  checks for this and says so.

- **Port 6543 is the transaction pooler** and cannot apply schema changes. Paste
  that string and the script uses the session connection on 5432 for setup while
  still handing back the pooler as the runtime `DATABASE_URL`, which is the right
  way round: pooling suits an API making many short-lived connections.
- **Supabase gives you a database rather than letting you create one.** The
  migrator notices, says so, and carries on instead of failing.

### Connection string or discrete fields

The API accepts either. `DATABASE_URL` wins when set, which is what every managed
host hands you; the discrete `DB_HOST`/`DB_PORT`/`DB_NAME`/`DB_USER`/`DB_PASSWORD`
remain for a local container. TLS defaults to on for a remote host and off for
localhost, and `DB_SSL` overrides that either way.

> The project began on Microsoft SQL Server and was migrated. That mattered for
> hosting: there is no widely available free managed SQL Server, and the only
> free route was Azure SQL's serverless offer, which needs a card and stops when
> its monthly compute allowance runs out.

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
DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
DB_SSL=true                   # managed Postgres requires TLS
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
