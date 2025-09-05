import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

/**
 * Prisma client with connection pooling
 *
 * Connection pooling is configured via environment variables:
 * - POSTGRES_PRISMA_URL: Pooled connection URL (used for normal operations)
 * - POSTGRES_URL_NON_POOLING: Direct connection URL (used for migrations)
 *
 * The pooled URL automatically handles connection pooling through PgBouncer or similar.
 */
const prismaClient = global.prisma || new PrismaClient({
  // Connection pooling is handled by the database URL configuration
  // Additional Prisma client options can be added here if needed
});

if (process.env.NODE_ENV !== "production") {
  global.prisma = prismaClient;
}

export const prisma = prismaClient;
export default prisma;


