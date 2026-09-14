/** Local development server. On Vercel the app is served by api/index.ts. */
import { buildApp } from './app.js'

try {
  process.loadEnvFile()
} catch {
  // No .env file: rely on the environment.
}

const port = Number(process.env.API_PORT ?? 3001)
const app = buildApp({ logger: true })

app.listen({ port, host: '127.0.0.1' }).catch((error: unknown) => {
  app.log.error(error)
  process.exit(1)
})
