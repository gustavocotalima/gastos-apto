# Repository Guidelines

## Project Structure & Module Organization

Application code lives under `src/`. Next.js App Router pages and layouts are in `src/app`, with HTTP handlers under `src/app/api`. Reusable UI belongs in `src/components`; shared domain logic, authentication, environment validation, and database access belong in `src/lib`; React hooks live in `src/hooks`. Keep static assets in `public/` and ambient declarations in `types/`.

Prisma owns persistence: edit `prisma/schema.prisma`, add generated SQL migrations under `prisma/migrations/`, and use `prisma/seed.ts` for seed data. Unit tests are colocated with source files (for example, `src/lib/expense-calculations.test.ts`); browser tests live in `cypress/e2e/`.

## Build, Test, and Development Commands

- `pnpm dev` starts the Turbopack development server.
- `pnpm build` generates the Prisma client and creates the production Next.js build.
- `pnpm start` serves a completed production build.
- `pnpm lint` runs the Next.js TypeScript and Core Web Vitals ESLint rules.
- `pnpm test:run` runs the Vitest suite once; `pnpm test:watch` reruns affected tests while developing.
- `pnpm test:coverage` produces unit-test coverage; no numeric threshold is currently configured.
- `pnpm test:e2e` runs Cypress against `http://localhost:3000`, so start the application first.
- `pnpm prisma migrate deploy` applies migrations; `pnpm prisma db seed` loads optional seed data.

## Coding Style & Naming Conventions

Use strict TypeScript, two-space indentation, and the `@/*` alias for imports from `src/`. Name React components and types in PascalCase, functions and variables in camelCase, and source files in kebab-case. Keep route handlers in Next.js `route.ts` files and page entry points in `page.tsx`. Preserve clear server/client boundaries and add `"use client"` only where browser APIs or interactive hooks require it. Run ESLint before submitting changes.

## Testing Guidelines

Write Vitest tests as `*.test.ts` or `*.test.tsx`; the suite uses jsdom and `src/test/setup.ts`. Name Cypress specifications `*.cy.ts` and place full user workflows in `cypress/e2e/`. Prioritize unit coverage for calculations and validation, and end-to-end coverage for authentication, API-backed forms, and navigation.

## Commit & Pull Request Guidelines

Recent commits favor concise, imperative Conventional Commit prefixes such as `refactor(ac):`, `security:`, `build:`, `docs:`, and `chore:`. Keep each commit focused. Pull requests should explain behavior and user impact, list verification performed, call out migrations or environment changes, link relevant issues, and include screenshots for visible UI changes.

## Security & Configuration

Copy `.env.example` to `.env` and never commit secrets. Validate changes involving authentication, rate limits, database writes, or monthly settlement locking carefully. Treat migration resets and Makefile cleanup targets as destructive operations.
