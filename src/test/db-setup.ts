import { PrismaClient } from "@prisma/client";
import { execSync } from "child_process";
import { randomBytes } from "crypto";

// Create isolated test database for each test run
const generateTestDbName = () => `homework_test_${randomBytes(8).toString('hex')}`;

let testDb: PrismaClient | null = null;
let testDbName: string | null = null;

export async function setupTestDatabase(): Promise<PrismaClient> {
  if (testDb) return testDb;

  testDbName = generateTestDbName();
  
  // Create test database
  const adminDb = new PrismaClient({
    datasources: {
      db: {
        url: "postgresql://postgres:postgres@db:5432/postgres"
      }
    }
  });

  try {
    await adminDb.$executeRawUnsafe(`CREATE DATABASE "${testDbName}"`);
  } catch (error) {
    // Database might already exist, that's okay
    console.warn(`Test database creation warning:`, error);
  } finally {
    await adminDb.$disconnect();
  }

  // Connect to test database
  testDb = new PrismaClient({
    datasources: {
      db: {
        url: `postgresql://postgres:postgres@db:5432/${testDbName}`
      }
    }
  });

  // Run migrations on test database
  try {
    execSync(`DATABASE_URL="postgresql://postgres:postgres@db:5432/${testDbName}" npx prisma db push`, {
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: `postgresql://postgres:postgres@db:5432/${testDbName}` }
    });
  } catch (error) {
    console.error('Failed to setup test database schema:', error);
    throw error;
  }

  return testDb;
}

export async function cleanupTestDatabase(): Promise<void> {
  if (!testDb || !testDbName) return;

  try {
    await testDb.$disconnect();
    
    // Drop test database
    const adminDb = new PrismaClient({
      datasources: {
        db: {
          url: "postgresql://postgres:postgres@db:5432/postgres"
        }
      }
    });

    await adminDb.$executeRawUnsafe(`DROP DATABASE IF EXISTS "${testDbName}"`);
    await adminDb.$disconnect();
  } catch (error) {
    console.error('Failed to cleanup test database:', error);
  } finally {
    testDb = null;
    testDbName = null;
  }
}

export async function resetTestDatabase(): Promise<void> {
  if (!testDb) return;

  // Clean all data from tables while preserving schema
  const tablenames = await testDb.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_tables WHERE schemaname='public'
  `;

  for (const { tablename } of tablenames) {
    if (tablename !== '_prisma_migrations') {
      try {
        await testDb.$executeRawUnsafe(`TRUNCATE TABLE "public"."${tablename}" CASCADE`);
      } catch (error) {
        console.warn(`Failed to truncate ${tablename}:`, error);
      }
    }
  }
}

export { testDb };
