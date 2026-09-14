import type { FastifyInstance } from 'fastify'
import { loginSchema, registerSchema } from '../../../shared/schemas.js'
import { clearSessionCookie, createSessionToken, getSessionUserId, setSessionCookie } from '../../lib/auth.js'
import { ok, parseInput } from '../../lib/http.js'
import { authenticate, findUserById, registerUser } from './auth.service.js'

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post('/register', async (request, reply) => {
    const user = await registerUser(parseInput(registerSchema, request.body))
    setSessionCookie(reply, await createSessionToken(user.id))
    return reply.code(201).send(ok({ user }))
  })

  app.post('/login', async (request, reply) => {
    const user = await authenticate(parseInput(loginSchema, request.body))
    setSessionCookie(reply, await createSessionToken(user.id))
    return ok({ user })
  })

  app.post('/logout', async (_request, reply) => {
    clearSessionCookie(reply)
    return ok({ loggedOut: true })
  })

  /** Current session. Anonymous visitors get `user: null` instead of an error. */
  app.get('/me', async (request, reply) => {
    const userId = await getSessionUserId(request)
    const user = userId ? await findUserById(userId) : null
    if (userId && !user) clearSessionCookie(reply)
    return ok({ user })
  })
}
