import React from "react";
import { vi } from "vitest";

vi.mock("next-auth/react", () => {
  return {
    __esModule: true,
    signIn: vi.fn(),
    signOut: vi.fn(),
    useSession: () => ({ data: null, status: "unauthenticated" }),
    SessionProvider: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
  };
});

// Mock Next.js app router hooks used in components under test
vi.mock("next/navigation", () => {
  return {
    __esModule: true,
    useRouter: () => ({
      push: vi.fn(),
      replace: vi.fn(),
      refresh: vi.fn(),
      prefetch: vi.fn(),
    }),
    usePathname: () => "/",
  };
});
