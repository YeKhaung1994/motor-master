# Deploying to Render, step by step

Two services and a database that already exists:

| Piece | Where | Type |
|---|---|---|
| Database | Supabase | already migrated and populated |
| API | Render | Web Service, Docker runtime |
| Web | Render | Static Site |

Roughly fifteen minutes, most of it waiting for builds.

---

## Before you start

**Push the repository.** Render deploys what is on GitHub, not what is on your
machine. If `render.yaml` and `Dockerfile` are not on the remote, the Blueprint
will not find them.

```bash
git push origin main
git ls-tree --name-only origin/main | grep -E 'render.yaml|Dockerfile'
```

**Have the Supabase connection string ready**, in *transaction pooler* form —
Supabase dashboard → Project Settings → Database → Connection string → **Transaction
pooler**:

```
postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres
```

Port **6543**, not 5432. A host that sleeps and restarts opens and drops
connections constantly, and that is what the pooler is for. The 5432 session port
is for migrations, which you run from your own machine.

---

## 1. Create the services

**render.com → New → Blueprint → connect the repository.**

Render reads `render.yaml` and offers both services:

- `motor-master-api` — Web Service, Docker
- `motor-master-web` — Static Site

It will ask for the values marked `sync: false`. Leave `WEB_ORIGIN` as a
placeholder for now — the web service does not exist yet, so its URL is not
known. Everything else is in the blueprint.

*Creating them by hand instead?* New → Web Service → connect the repo → language
**Docker**, health check path `/api/v1/health`, instance type **Free**. Then New →
Static Site → build command `npm ci && npm run build --workspace @motor-master/web`,
publish directory `apps/web/dist`.

## 2. Set the API's environment variables

On `motor-master-api` → Environment:

```
DATABASE_URL   postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres
DB_SSL         true
WEB_ORIGIN     https://placeholder.invalid      ← corrected in step 5
LOG_LEVEL      info
```

`PORT` is injected by Render; do not set it.

## 3. Wait for the API, then check it

The first Docker build takes a few minutes. When it goes live:

```bash
curl https://motor-master-api.onrender.com/api/v1/health
# {"ok":true,"db":"up"}

curl 'https://motor-master-api.onrender.com/api/v1/bikes?pageSize=1'
# {"items":[...],"total":227,...}
```

`"db":"up"` means it reached Supabase. `"db":"down"` means it did not — check
`DATABASE_URL` and that `DB_SSL` is `true`.

Note the URL. Render derives it from the service name, so it is usually
`https://motor-master-api.onrender.com`.

## 4. Point the web build at the API

On `motor-master-web` → Environment:

```
VITE_API_URL   https://motor-master-api.onrender.com/api/v1
```

Then **Manual Deploy → Clear build cache & deploy**. This value is compiled into
the bundle, so it needs a rebuild rather than a restart — a plain redeploy of an
existing build will not pick it up.

Expect this build to be slow: the publish directory is about 153 MB, nearly all
of it model photography.

## 5. Let the browser through

Back on `motor-master-api` → Environment, set the real value:

```
WEB_ORIGIN     https://motor-master-web.onrender.com
```

Exactly the origin — scheme and host, no trailing slash, no path. Save; Render
restarts the service.

This is the step that is easy to get wrong, and it fails in a way that looks like
the API is broken: the API stays healthy when you curl it, while every page in
the browser shows an error. That is CORS. Check with:

```bash
curl -s -D - -o /dev/null \
  -H 'Origin: https://motor-master-web.onrender.com' \
  https://motor-master-api.onrender.com/api/v1/brands | grep -i access-control
# access-control-allow-origin: https://motor-master-web.onrender.com
```

## 6. Open the site

`https://motor-master-web.onrender.com` — the catalogue should list 227 models
across 12 brands, filters and compare should work, and photographs should load.

---

## What to expect afterwards

**The first visit after a quiet period is slow.** The free API sleeps after about
fifteen minutes idle and takes tens of seconds to wake. Supabase pauses a project
after seven days of no activity. Together, a visitor can wait for both.

A free cron hitting `/api/v1/health` every ten minutes keeps the API awake and the
database in use. Render's own Cron Job service can do it, though on the free plan
that is another service; an external pinger avoids that.

**Deploys are automatic** on push to `main`. Render watches the connected branch
through a GitHub webhook set up when you first connect the repository — no
further wiring.

`render.yaml` also carries build filters, so a push only rebuilds what it
touches:

| You change | Rebuilds |
|---|---|
| `apps/api/**`, `Dockerfile` | API |
| `apps/web/**`, `packages/share_ui/**` | Web |
| `package.json`, `package-lock.json`, `render.yaml` | both |
| `docs/**`, `README.md` | nothing |

Without those filters every push rebuilds everything, and the web build ships
153 MB — a typo fixed in a README would cost a full container build and a
153 MB upload.

Turn it off per service under Settings → Build & Deploy if you would rather
deploy by hand.

**Schema changes are not automatic, deliberately.** Nothing runs migrations on
start-up. When the schema changes, run them yourself against the hosted database
with the *session* connection (5432):

```bash
npm run db:migrate
npm run db:seed
```

## When something is wrong

| Symptom | Cause |
|---|---|
| `{"ok":false,"db":"down"}` | `DATABASE_URL` wrong, or `DB_SSL` not `true` |
| API fine in curl, every page errors | `WEB_ORIGIN` does not match the site's origin exactly |
| Pages load, no data, console shows CORS | same |
| `/bikes/<slug>` returns Render's 404 | the static site is missing the `/*` → `/index.html` rewrite |
| Data loads but the API URL looks wrong | `VITE_API_URL` changed without a rebuild |
| First request takes 30–50 seconds | the free instance was asleep; expected |
