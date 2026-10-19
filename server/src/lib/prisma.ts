/**
 * Client Prisma partagé (SQLite local).
 * Le fichier de base est créé automatiquement par `npm run db:push`.
 */

import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __startupcheckPrisma: PrismaClient | undefined;
}

export const prisma =
  global.__startupcheckPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') {
  global.__startupcheckPrisma = prisma;
}
