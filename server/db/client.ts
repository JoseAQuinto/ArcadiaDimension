import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'
import { getEnv } from '../config/env.js'
import * as schema from './schema.js'

function createDatabase() {
  const pool = new pg.Pool({
    connectionString: getEnv().DATABASE_URL,
    // Serverless instances handle one request at a time; keep the pool small
    // and rely on Neon's pooled endpoint for fan-out.
    max: 5,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
  })
  return drizzle({ client: pool, schema })
}

export type Database = ReturnType<typeof createDatabase>
export type Transaction = Parameters<Parameters<Database['transaction']>[0]>[0]
export type Executor = Database | Transaction

let database: Database | undefined

/** Lazily creates a single pool per process (reused across warm invocations). */
export function getDb(): Database {
  database ??= createDatabase()
  return database
}

export async function closeDb(): Promise<void> {
  await database?.$client.end()
  database = undefined
}
