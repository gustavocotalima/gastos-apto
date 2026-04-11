import 'dotenv/config'
import { defineConfig, env } from "prisma/config"

// The datasource URL is only required for commands that touch the
// database (migrate deploy/dev, db push, studio). `prisma generate`
// is pure code generation and does not need a connection. We therefore
// include the datasource block *only* when DATABASE_URL is actually
// set in process.env — this lets `prisma generate` run in build-time
// contexts (Docker builder stage, CI without env) without requiring
// a placeholder URL. Runtime contexts (container start) always have
// DATABASE_URL present via the container environment.
const hasDatabaseUrl = Boolean(process.env.DATABASE_URL)

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  ...(hasDatabaseUrl
    ? { datasource: { url: env("DATABASE_URL") } }
    : {}),
})
