import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set')
  }

  // FIX: Added SSL and appropriate pool settings for Neon + Vercel serverless.
  // In serverless environments each function invocation is short-lived, so a large
  // pool provides no benefit and can exhaust Neon's connection limit quickly.
  // Using max:1 per function instance is recommended for serverless.
  // SSL is required for Neon connections.
  const pool = new Pool({
    connectionString,
    max: process.env.NODE_ENV === 'production' ? 1 : 10,
    ssl: process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : undefined,
  })

  return new PrismaClient({
    adapter: new PrismaPg(pool),
    log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['warn', 'error'],
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
