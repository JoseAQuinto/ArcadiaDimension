import { eq, sql } from 'drizzle-orm'
import type { z } from 'zod'
import type { User } from '../../../shared/api.js'
import type { loginSchema, registerSchema } from '../../../shared/schemas.js'
import { getDb } from '../../db/client.js'
import { toUserDto } from '../../db/mappers.js'
import { users } from '../../db/schema.js'
import { getTimingSafeDummyHash, hashPassword, verifyPassword } from '../../lib/auth.js'
import { getErrorCode, UNIQUE_VIOLATION } from '../../lib/db-errors.js'
import { conflict, unauthorized } from '../../lib/errors.js'

const EMAIL_TAKEN = 'Ya existe una cuenta con este email'

const byEmail = (email: string) => sql`lower(${users.email}) = ${email.toLowerCase()}`

export async function registerUser(input: z.output<typeof registerSchema>): Promise<User> {
  const db = getDb()
  const [existing] = await db.select({ id: users.id }).from(users).where(byEmail(input.email)).limit(1)
  if (existing) throw conflict(EMAIL_TAKEN)

  const passwordHash = await hashPassword(input.password)
  try {
    const [user] = await db.insert(users).values({ name: input.name, email: input.email, passwordHash }).returning()
    return toUserDto(user)
  } catch (error) {
    if (getErrorCode(error) === UNIQUE_VIOLATION) throw conflict(EMAIL_TAKEN)
    throw error
  }
}

export async function authenticate({ email, password }: z.output<typeof loginSchema>): Promise<User> {
  const [user] = await getDb().select().from(users).where(byEmail(email)).limit(1)
  const passwordMatches = await verifyPassword(password, user?.passwordHash ?? (await getTimingSafeDummyHash()))

  if (!user || !passwordMatches) throw unauthorized('Email o contraseña incorrectos')
  return toUserDto(user)
}

export async function findUserById(id: string): Promise<User | null> {
  const [user] = await getDb().select().from(users).where(eq(users.id, id)).limit(1)
  return user ? toUserDto(user) : null
}
