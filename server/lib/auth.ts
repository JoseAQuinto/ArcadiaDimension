import bcrypt from 'bcryptjs'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { jwtVerify, SignJWT } from 'jose'
import { getEnv } from '../config/env.js'
import { unauthorized } from './errors.js'

export const SESSION_COOKIE = 'ad_session'
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7
const TOKEN_ISSUER = 'arcadia-dimension'
const BCRYPT_ROUNDS = 10

declare module 'fastify' {
  interface FastifyRequest {
    userId: string
  }
}

const secretKey = () => new TextEncoder().encode(getEnv().JWT_SECRET)

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS)
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

let dummyHash: Promise<string> | undefined

/** Compared when the email does not exist, so response times do not reveal which accounts exist. */
export function getTimingSafeDummyHash(): Promise<string> {
  dummyHash ??= bcrypt.hash('arcadia-dimension-timing-guard', BCRYPT_ROUNDS)
  return dummyHash
}

export async function createSessionToken(userId: string): Promise<string> {
  return new SignJWT()
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuer(TOKEN_ISSUER)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(secretKey())
}

async function readUserId(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey(), { issuer: TOKEN_ISSUER, algorithms: ['HS256'] })
    return payload.sub ?? null
  } catch {
    return null
  }
}

export function setSessionCookie(reply: FastifyReply, token: string): void {
  reply.setCookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: getEnv().NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  })
}

export function clearSessionCookie(reply: FastifyReply): void {
  reply.clearCookie(SESSION_COOKIE, { path: '/' })
}

/** preHandler hook: rejects the request unless it carries a valid session. */
export async function requireAuth(request: FastifyRequest): Promise<void> {
  const token = request.cookies[SESSION_COOKIE]
  const userId = token ? await readUserId(token) : null
  if (!userId) throw unauthorized()
  request.userId = userId
}
