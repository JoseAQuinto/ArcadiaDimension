import { defineConfig } from 'vitest/config'

/** API tests against a real PostgreSQL database (DATABASE_URL). */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['server/**/*.integration.test.ts'],
    fileParallelism: false,
    testTimeout: 20_000,
    hookTimeout: 20_000,
  },
})
