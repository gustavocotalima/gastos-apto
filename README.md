# Gastos Apto

Web app for splitting shared apartment expenses between any number of
roommates. Handles monthly expenses, custom per-category splits, air
conditioning electricity cost allocation with CIP (Brazilian public
lighting tax) tier calculation, and monthly settlements.

## Stack

- **Next.js 16** (App Router, standalone output)
- **PostgreSQL** + **Prisma 7** (driver adapters, `@prisma/adapter-pg`)
- **Better Auth** (email + password, sign-up disabled, rate-limited)
- **Tailwind CSS v4** + **Radix UI** + **shadcn/ui** components
- **React Hook Form** + **Zod** for forms and validation
- **next-pwa** for offline support
- **Vitest** (unit) + **Cypress** (e2e)

## Getting started

```bash
pnpm install
cp .env.example .env          # fill in values
pnpm prisma migrate deploy    # apply schema
pnpm prisma db seed           # optional: seed categories + CIP config
pnpm dev
```

Required env vars (see `.env.example`):

- `DATABASE_URL` — PostgreSQL connection string
- `BETTER_AUTH_SECRET` — generate with `openssl rand -base64 32`
- `BETTER_AUTH_URL` — base URL of the app
- `NEXT_PUBLIC_APP_URL` — same as above, exposed to the client

Sign-up is disabled by design. Create users directly in the database
or via the admin UI.

## Scripts

```bash
pnpm dev          # Turbopack dev server
pnpm build        # prisma generate && next build
pnpm start        # production server
pnpm lint         # eslint
pnpm test         # vitest
pnpm test:e2e     # cypress
pnpm prisma studio
```

## Docker

```bash
docker build -t gastos-apto .
docker run -p 3000:3000 --env-file .env gastos-apto
```

The Dockerfile uses Next.js standalone output with a non-root runtime
user. `prisma migrate deploy` runs on container start.

## How expense splitting works

- **Categories** have a default split type: `EQUAL` (divided among
  active users) or `CUSTOM` (per-user percentages via `CategorySplit`).
- **Expenses** inherit the category split, but individual expenses can
  override with `ExpenseSplit`.
- **Air conditioning usage** is recorded per-user with total apartment
  consumption. The app computes the AC user's extra cost (AC energy +
  CIP tier delta from pushing consumption into a higher tier) and
  generates a real `Expense` (Electricity bill) with custom splits, so
  the AC surcharge flows through the normal settlement pipeline rather
  than as a parallel charge.
- **Monthly settlements** aggregate expenses by payer and share,
  producing the net who-owes-whom for the month, and can be locked on
  close.

## Project layout

```
src/
  app/
    api/          Route handlers (expenses, categories, AC, CIP, months)
    (pages)/      App Router pages (login, dashboard, categories, AC, settings)
  components/     UI components (server and client)
  lib/            auth, prisma client, env validation, calculations
prisma/
  schema.prisma   models + relations
  migrations/     SQL migrations
```

