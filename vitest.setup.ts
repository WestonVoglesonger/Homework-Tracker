import React from "react";
import { vi, beforeEach, afterEach, beforeAll, afterAll } from "vitest";
import "@testing-library/jest-dom";
import { setupTestDatabase, cleanupTestDatabase, resetTestDatabase, testDb } from "./src/test/db-setup";

// Mock Next.js modules
vi.mock("next/router", () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    pathname: "/",
    query: {},
    asPath: "/",
  })),
}));

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    refresh: vi.fn(),
  })),
  useSearchParams: vi.fn(() => ({
    get: vi.fn(),
    getAll: vi.fn(),
  })),
  usePathname: vi.fn(() => "/"),
}));

// Mock NextAuth
vi.mock("next-auth/react", () => ({
  __esModule: true,
  signIn: vi.fn(),
  signOut: vi.fn(),
  useSession: vi.fn(() => ({ 
    data: null, 
    status: "unauthenticated",
    update: vi.fn(),
  })),
  SessionProvider: ({ children }: { children: React.ReactNode }) => 
    React.createElement(React.Fragment, null, children),
}));

vi.mock("next-auth", () => ({
  __esModule: true,
  default: vi.fn(),
  getServerSession: vi.fn(),
}));

// Mock React Query
vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(() => ({
    data: null,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  })),
  useMutation: vi.fn(() => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    isLoading: false,
    error: null,
    isPending: false,
    isError: false,
    isIdle: false,
    isSuccess: false,
    failureCount: 0,
    failureReason: null,
    reset: vi.fn(),
    status: 'idle',
    submittedAt: 0,
    variables: undefined
  })),
  QueryClient: vi.fn(() => ({
    invalidateQueries: vi.fn(),
    setQueryData: vi.fn(),
    getQueryData: vi.fn(),
  })),
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => 
    React.createElement(React.Fragment, null, children),
  useQueryClient: vi.fn(() => ({
    invalidateQueries: vi.fn(),
    setQueryData: vi.fn(),
    getQueryData: vi.fn(),
  })),
}));

// Mock Sonner toast notifications
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
  },
  Toaster: () => null,
}));

// Mock Vercel Analytics
vi.mock("@vercel/analytics/react", () => ({
  Analytics: () => null,
  track: vi.fn(),
}));

// Old service mocks removed - integration tests now use OOP services

// Mock crypto for consistent test runs
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: vi.fn(() => new Uint8Array(32).fill(1)),
    randomUUID: vi.fn(() => 'test-uuid-123'),
  },
});

// Mock environment variables
(process.env as any).NODE_ENV = 'test';
(process.env as any).NEXTAUTH_SECRET = 'test-secret-key';
(process.env as any).NEXTAUTH_URL = 'http://localhost:3000';
(process.env as any).POSTGRES_PRISMA_URL = 'postgresql://postgres:postgres@db:5432/homework_test';
(process.env as any).POSTGRES_URL_NON_POOLING = 'postgresql://postgres:postgres@db:5432/homework_test';

// Global test database setup
beforeAll(async () => {
  try {
    await setupTestDatabase();
  } catch (error) {
    console.error('Failed to setup test database:', error);
    throw error;
  }
});

afterAll(async () => {
  await cleanupTestDatabase();
});

// Clean database between tests for isolation
beforeEach(async () => {
  vi.clearAllMocks();
  await resetTestDatabase();
});

afterEach(() => {
  vi.resetAllMocks();
});

// Increase timeout for database operations
vi.setConfig({ testTimeout: 10000, hookTimeout: 10000 });