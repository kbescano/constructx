# ConstructX — Demo

A standalone, self-contained copy of the ConstructX admin dashboard: the
quotation pipeline, client/order management, and reporting screens, with
sample data and lightweight on-screen tips so a first-time visitor can
explore it without a walkthrough.

This is a **demo build for prospects**, not the production Primegen system —
it runs against its own database and has no connection to any client's real
data.

## What's included

- **Admin dashboard** (`/admin-dashboard`) — quotation inbox, client
  quotations, orders, supplier POs, deliveries, reports, sales report
- **Payload CMS** — the data layer (products, clients, suppliers, users) at `/admin`
- **Onboarding tips** — small dismissible bubbles on the first few screens
  (search, cards, nav, "create inquiry") that explain what each thing does.
  Reset them anytime from **Show tips** next to Logout.
- **Seed script** — populates a fresh database with staff accounts, a
  product catalog, clients, suppliers, and quotation requests / client
  quotations / orders spread across every pipeline stage, so the dashboard
  and reports have something real to show immediately.

## Setup

1. `npm install`
2. Copy `.env.example` to `.env` and fill in:
   - `DATABASE_URI` — a **fresh** Postgres connection string (e.g. a new Neon project). Don't point this at a production database.
   - `PAYLOAD_SECRET` — any long random string (`openssl rand -base64 32`)
   - `CLOUDINARY_API_KEY` / `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_SECRET` — for media storage
   - Everything else in `.env.example` is optional (see the file for what it's for)
3. `npm run dev` — first boot will prompt you through Payload's schema push (accept it; there's no data yet to lose)
4. Seed the demo data:
   ```bash
   npx tsx seed-categories.ts   # product categories (Bolts & Fasteners, Steel Plates, etc.)
   npx tsx scripts/seed.ts      # staff accounts, products, clients, suppliers, pipeline data
   ```
5. Visit `localhost:3000/admin-login` and sign in with any of the accounts the seed script prints, e.g.:
   - `admin@constructx.demo` / `Demo1234!` — Super Admin (sees everything)
   - `juan@constructx.demo` / `Demo1234!` — Sales staff (sees only their own assigned requests)

**Before sharing the link publicly:** change these seeded passwords (or
delete the seeded users and create your own), and re-run `npx tsx
scripts/seed.ts` any time you want to reset the demo back to its starting
state — it's safe to re-run, it skips whatever already exists.

## Notes for whoever's presenting this demo

- Every write actually persists to the database — a visitor exploring the
  pipeline changes real rows. Re-running the seed script won't undo their
  changes (it only adds what's missing); if you need a clean slate, wipe
  the database and re-seed.
- The Meta Ads agent backend (`/api/agent/run`, `src/lib/agentAnalysis.ts`)
  is still present in the codebase but has no dashboard UI in this build —
  safe to ignore unless you specifically want to wire it up.
