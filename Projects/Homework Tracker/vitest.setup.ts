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
