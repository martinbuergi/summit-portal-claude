/**
 * Database Connection
 *
 * Prisma client instance for database operations.
 */

import { PrismaClient } from '@prisma/client';

let prisma;

/**
 * Gets the Prisma client instance
 * Uses singleton pattern for serverless functions
 */
export function getDb() {
  if (!prisma) {
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  }
  return prisma;
}

/**
 * Disconnects from the database
 * Call this at the end of long-running processes
 */
export async function disconnectDb() {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
}
