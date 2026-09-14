import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must contain at least 32 characters'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

export type Env = z.infer<typeof envSchema>

export class ConfigurationError extends Error {
  override name = 'ConfigurationError'
}

let cachedEnv: Env | undefined

/**
 * Environment variables are validated lazily so a misconfigured deployment
 * answers with a clean JSON error instead of crashing on import.
 */
export function getEnv(): Env {
  if (cachedEnv) return cachedEnv

  const result = envSchema.safeParse(process.env)
  if (!result.success) {
    const problems = result.error.issues.map((issue) => issue.message).join('; ')
    throw new ConfigurationError(`Invalid environment configuration: ${problems}`)
  }

  cachedEnv = result.data
  return cachedEnv
}
