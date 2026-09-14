/**
 * Executes one or more SQL files against DATABASE_URL.
 * Usage: npm run db:exec -- database/schema.sql database/demo.sql
 */
import { readFile } from 'node:fs/promises'
import pg from 'pg'

try {
  process.loadEnvFile()
} catch {
  // No .env file: rely on the environment.
}

const files = process.argv.slice(2)
const connectionString = process.env.DATABASE_URL

if (files.length === 0) {
  console.error('Usage: npm run db:exec -- <file.sql> [more.sql]')
  process.exit(1)
}
if (!connectionString) {
  console.error('DATABASE_URL is not defined. Copy .env.example to .env and fill it in.')
  process.exit(1)
}

const client = new pg.Client({ connectionString })
await client.connect()

try {
  for (const file of files) {
    await client.query(await readFile(file, 'utf8'))
    console.log(`✓ ${file}`)
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
} finally {
  await client.end()
}
