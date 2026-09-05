#!/usr/bin/env bash
#
# Point motor-master at a Supabase database: check the connection, apply the
# schema, import the catalogues, and print the environment variables the API and
# web hosts need.
#
#   ./scripts/setup-supabase.sh 'postgresql://postgres.<ref>:<password>@<host>:5432/postgres'
#
# With no argument it reads DATABASE_URL from the environment, then from .env,
# and only prompts if neither has it. After a successful run it offers to write
# the string into .env so later commands need no argument at all.
#
# Safe to re-run: migrations are tracked and the import is matched on slug, so
# nothing duplicates.
set -euo pipefail

RED=$'\033[0;31m'; GREEN=$'\033[0;32m'; YELLOW=$'\033[0;33m'; DIM=$'\033[2m'; OFF=$'\033[0m'
say()  { printf '%s\n' "$*"; }
ok()   { printf '%s✓%s %s\n' "$GREEN" "$OFF" "$*"; }
warn() { printf '%s!%s %s\n' "$YELLOW" "$OFF" "$*"; }
die()  { printf '%s✗%s %s\n' "$RED" "$OFF" "$*" >&2; exit 1; }

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

ENV_FILE="$ROOT/.env"

# Read one variable out of .env without sourcing the file — a stray command in
# there should not run just because we wanted a connection string.
read_env() {
  [ -f "$ENV_FILE" ] || return 0
  sed -n "s/^[[:space:]]*$1=//p" "$ENV_FILE" | tail -n 1 | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//"
}

DB_URL="${1:-${DATABASE_URL:-}}"
FROM_ENV_FILE=0
if [ -z "$DB_URL" ]; then
  DB_URL="$(read_env DATABASE_URL)"
  [ -n "$DB_URL" ] && FROM_ENV_FILE=1 && ok "Using DATABASE_URL from .env"
fi

if [ -z "$DB_URL" ]; then
  say "Supabase → Project Settings → Database → Connection string → URI"
  say "${DIM}It looks like postgresql://postgres.<ref>:<password>@<host>:5432/postgres${OFF}"
  say ""
  read -r -p "Paste the connection string: " DB_URL
fi
[ -n "$DB_URL" ] || die "No connection string given."

case "$DB_URL" in
  postgres://*|postgresql://*) ;;
  *) die "That does not look like a Postgres connection string." ;;
esac

case "$DB_URL" in
  *"[YOUR-PASSWORD]"*|*"<password>"*|*"[password]"*)
    die "The placeholder password is still in the string — paste your real one." ;;
esac

# Port 6543 is Supabase's transaction pooler. It cannot run the schema changes a
# migration needs; the session connection on 5432 can.
# The URL used at runtime may differ from the one used to apply the schema.
RUNTIME_URL="$DB_URL"
case "$DB_URL" in
  *:6543/*)
    warn "That is the transaction pooler (port 6543), which cannot apply schema changes."
    warn "Using the session connection on 5432 for setup; the pooler stays the runtime URL."
    DB_URL="${DB_URL/:6543/:5432}"
    ;;
esac

export DATABASE_URL="$DB_URL"
# Supabase requires TLS, but let a caller override for a local dry run.
export DB_SSL="${DB_SSL:-true}"

SSL_JS='process.env.DB_SSL === "false" ? false : { rejectUnauthorized: false }'

say ""
say "Database: ${DIM}$(node -e 'const u=new URL(process.env.DATABASE_URL);console.log(`${u.hostname}:${u.port||5432}${u.pathname}`)')${OFF}"
say ""

# Supabase's direct host (db.<ref>.supabase.co) publishes only an AAAA record.
# On a network without IPv6 it cannot resolve at all, and the error — ENOTFOUND —
# reads like a typo rather than the addressing problem it is.
case "$DB_URL" in
  *db.*.supabase.co*)
    if ! curl -s -m 6 -6 -o /dev/null https://ipv6.google.com 2>/dev/null; then
      warn "This is the direct connection (db.<ref>.supabase.co), which is IPv6-only,"
      warn "and this machine has no working IPv6 route — it cannot reach it."
      warn ""
      warn "Use a pooler string instead, from the same dashboard page:"
      warn "  Session pooler     aws-0-<region>.pooler.supabase.com:5432   (for this setup)"
      warn "  Transaction pooler aws-0-<region>.pooler.supabase.com:6543   (for the API at runtime)"
      warn "Both are reachable over IPv4."
      die "Direct connection unreachable from this network."
    fi
    ;;
esac

say "1/4  Checking the connection"
node -e '
const { Client } = require("pg");
const ssl = process.env.DB_SSL === "false" ? false : { rejectUnauthorized: false };
const c = new Client({ connectionString: process.env.DATABASE_URL, ssl });
c.connect()
  .then(() => c.query("select version(), current_database()"))
  .then((r) => { console.log("     " + r.rows[0].version.split(",")[0]); return c.end(); })
  .catch((e) => { console.error("     " + e.message); process.exit(1); });
' || die "Could not connect. Check the password, and that your IP is allowed under Network Restrictions."
ok "Connected"

say ""
say "2/4  Applying the schema"
npm run db:migrate --silent
ok "Schema up to date"

say ""
say "3/4  Importing the catalogues"
if [ "${FRESH:-}" = "1" ]; then
  warn "FRESH=1 — clearing every brand and bike first"
  npm run db:seed:fresh --silent
else
  npm run db:seed --silent
fi
ok "Catalogues imported"

say ""
say "4/4  Verifying"
node -e '
const { Client } = require("pg");
const ssl = process.env.DB_SSL === "false" ? false : { rejectUnauthorized: false };
const c = new Client({ connectionString: process.env.DATABASE_URL, ssl });
const q = `select
  (select count(*) from brands) as brands,
  (select count(*) from bikes) as bikes,
  (select count(*) from bike_classes) as classes,
  (select count(*) from bike_markets) as markets,
  (select count(*) from bike_prices) as prices,
  (select count(*) from bikes where price_amount is not null) as priced`;
c.connect().then(() => c.query(q)).then((r) => {
  const x = r.rows[0];
  console.log(`     ${x.brands} brands, ${x.bikes} bikes, ${x.classes} classes`);
  console.log(`     ${x.markets} market rows, ${x.prices} other-market prices, ${x.priced} priced`);
  if (Number(x.bikes) === 0) { console.error("     no bikes imported"); process.exit(1); }
  return c.end();
}).catch((e) => { console.error("     " + e.message); process.exit(1); });
' || die "Verification failed."
ok "Data is in place"

API_HOST_VARS="DATABASE_URL=$RUNTIME_URL
DB_SSL=true
WEB_ORIGIN=https://your-web-host
LOG_LEVEL=info"

# Offer to keep it, so `npm run db:migrate` and friends need no argument.
if [ "$FROM_ENV_FILE" -eq 0 ] && [ -f "$ENV_FILE" ] && ! grep -q '^[[:space:]]*DATABASE_URL=' "$ENV_FILE"; then
  say ""
  if [ -t 0 ]; then
    read -r -p "Save this connection string to .env? [y/N] " reply
  else
    reply="${SAVE_TO_ENV:-n}"
  fi
  case "$reply" in
    [yY]*)
      # dotenv lets a later assignment win, so this overrides the DB_* fields
      # above it. Only claim TLS when the host actually offers it.
      case "$RUNTIME_URL" in
        *localhost*|*127.0.0.1*) SAVE_SSL=false ;;
        *) SAVE_SSL=true ;;
      esac
      printf '\n# Added by scripts/setup-supabase.sh. Overrides the DB_* fields above.\nDATABASE_URL=%s\nDB_SSL=%s\n' "$RUNTIME_URL" "$SAVE_SSL" >> "$ENV_FILE"
      ok "Written to .env — it is git-ignored, so the string stays on this machine"
      warn "Every local command now uses this database, not the container."
      warn "Comment the line out to go back to the local container."
      ;;
    *) say "${DIM}Not saved. Pass the string again, or add DATABASE_URL to .env yourself.${OFF}" ;;
  esac
fi

say ""
say "${GREEN}Done.${OFF} Set these on the API host:"
say ""
printf '%s\n' "$API_HOST_VARS" | sed 's/^/    /'
say ""
say "And on the web host, at build time:"
say ""
say "    VITE_API_URL=https://your-api-host/api/v1"
say ""
say "${DIM}Then point WEB_ORIGIN at the deployed web origin and redeploy the API, so CORS lets the browser through.${OFF}"
if [ "$RUNTIME_URL" = "$DB_URL" ]; then
  say "${DIM}For the API's own runtime, prefer Supabase's transaction pooler (port 6543) — it handles many short-lived connections better than the session port.${OFF}"
fi
