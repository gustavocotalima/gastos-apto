import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { nextCookies } from "better-auth/next-js"
import { prisma } from "@/lib/prisma"
import { env } from "@/lib/env"
import bcrypt from "bcryptjs"

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  plugins: [nextCookies()],
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    password: {
      hash: async (password: string) => {
        return bcrypt.hash(password, 12)
      },
      verify: async (data: { hash: string; password: string }) => {
        return bcrypt.compare(data.password, data.hash)
      },
    },
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 10,
  },
  session: {
    expiresIn: 60 * 60 * 24, // 24 hours
    updateAge: 60 * 60, // 1 hour
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },
  trustedOrigins: [env.BETTER_AUTH_URL],
})

export type Session = typeof auth.$Infer.Session
