import { createAuthClient } from "better-auth/react"

const baseURL = process.env.NEXT_PUBLIC_APP_URL
if (!baseURL) {
  throw new Error("NEXT_PUBLIC_APP_URL must be set at build time")
}

export const authClient = createAuthClient({ baseURL })

export const { signIn, signOut, signUp, useSession } = authClient
