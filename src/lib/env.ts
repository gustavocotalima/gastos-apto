import { z } from "zod"

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  NEXTAUTH_URL: z.string().url("NEXTAUTH_URL must be a valid URL"),
  NEXTAUTH_SECRET: z.string().min(32, "NEXTAUTH_SECRET must be at least 32 characters"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
})

type Env = z.infer<typeof envSchema>

function validateEnv(): Env {
  try {
    return envSchema.parse(process.env)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues.map(e => e.path.join(".")).join(", ")
      console.error("❌ Invalid environment variables:", missingVars)
      console.error("Please check your .env file against .env.example")
      
      // Only throw in production, warn in development
      if (process.env.NODE_ENV === "production") {
        throw new Error(`Missing required environment variables: ${missingVars}`)
      }
    }
    // Return partial env in development for better DX
    return process.env as Env
  }
}

export const env = validateEnv()

// Type-safe environment variable access
export function getEnvVar(key: keyof Env): string {
  const value = env[key]
  if (!value && process.env.NODE_ENV === "production") {
    throw new Error(`Environment variable ${key} is not set`)
  }
  return value || ""
}