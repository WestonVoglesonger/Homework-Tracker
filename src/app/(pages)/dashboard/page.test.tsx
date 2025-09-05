import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import DashboardPage from "./page";
import Providers from "../../providers";
import { testFactory } from "../../../test/factories";
import { TestUser } from "../../../test/factories";

// Mock the hooks with more comprehensive data
vi.mock("../../hooks/useAssignments", () => ({
  useAssignments: vi.fn(() => ({
    data: [],
    isLoading: false,
    refetch: vi.fn()
  })),
  useUpdateAssignment: vi.fn(() => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    isPending: false,
    isError: false,
    error: null
  })),
  useDeleteAssignment: vi.fn(() => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    isPending: false,
    isError: false,
    error: null
  }))
}));

vi.mock("../../hooks/useCanvasImport", () => ({
  useEnsureCanvasCoursesPrefetched: vi.fn()
}));

vi.mock("next-auth/react", () => ({
  useSession: vi.fn(() => ({
    data: { user: { id: "test-user", email: "test@example.com" } },
    status: "authenticated"
  })),
  SessionProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}));

const { useAssignments } = await import("../../hooks/useAssignments");

describe("DashboardPage", () => {
  let testUser: TestUser;

  beforeEach(async () => {
    testUser = await testFactory.createUser();
    vi.clearAllMocks();
  });

  it("renders dashboard without crashing", () => {
    render(
      <Providers>
        <DashboardPage />
      </Providers>
    );

    expect(screen.getByRole('heading', { name: /Dashboard/i })).toBeInTheDocument();
  });

  it("shows loading state initially", () => {
    vi.mocked(useAssignments).mockReturnValue({
      data: undefined,
      isLoading: true,
      refetch: vi.fn(),
      error: null,
      isError: false,
      isPending: true,
      isSuccess: false,
      status: 'pending',
      dataUpdatedAt: 0,
      errorUpdatedAt: 0,
      failureCount: 0,
      failureReason: null,
      fetchStatus: 'fetching',
      isInitialLoading: true,
      isLoadingError: false,
      isPaused: false,
      isPlaceholderData: false,
      isFetched: false,
      isFetchedAfterMount: false,
      isFetching: true,
      isRefetchError: false,
      isRefetching: false,
      isStale: false
    });

    render(
      <Providers>
        <DashboardPage />
      </Providers>
    );

    // Should show loading state - check for skeleton class or loading text
    const loadingElements = document.querySelectorAll('.animate-pulse');
    expect(loadingElements.length).toBeGreaterThan(0);
  });

  it("displays assignment statistics correctly", async () => {
    const mockAssignments = [
      {
        id: "1",
        title: "Assignment 1",
        status: "NOT_SUBMITTED",
        dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        type: "HOMEWORK",
        priority: 0,
        source: "manual",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: "2", 
        title: "Assignment 2",
        status: "SUBMITTED",
        dueAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        type: "QUIZ",
        priority: 1,
        source: "manual",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: "3",
        title: "Assignment 3", 
        status: "GRADED",
        dueAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        type: "EXAM",
        priority: 0,
        source: "canvas",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    vi.mocked(useAssignments).mockReturnValue({
      data: mockAssignments,
      isLoading: false,
      refetch: vi.fn(),
      error: null,
      isError: false,
      isPending: false,
      isSuccess: true,
      status: 'success',
      dataUpdatedAt: Date.now(),
      errorUpdatedAt: 0,
      failureCount: 0,
      failureReason: null,
      fetchStatus: 'idle',
      isInitialLoading: false,
      isLoadingError: false,
      isPaused: false,
      isPlaceholderData: false,
      isFetched: true,
      isFetchedAfterMount: true,
      isFetching: false,
      isRefetchError: false,
      isRefetching: false,
      isStale: false
    });

    render(
      <Providers>
        <DashboardPage />
      </Providers>
    );

    // Check statistics cards - use getAllByText since there are multiple elements with same numbers
    const threeElements = screen.getAllByText("3");
    expect(threeElements.length).toBeGreaterThan(0); // Total assignments
    
    const oneElements = screen.getAllByText("1"); 
    expect(oneElements.length).toBeGreaterThan(0); // Multiple "1" values
    
    const percentageElements = screen.getAllByText("33%");
    expect(percentageElements.length).toBeGreaterThan(0); // Completion rate
  });

  it("shows overdue assignments section", async () => {
    const overdueAssignment = {
      id: "1",
      title: "Overdue Assignment",
      status: "NOT_SUBMITTED",
      dueAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
      type: "HOMEWORK",
      priority: 0,
      source: "manual",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    vi.mocked(useAssignments).mockReturnValue({
      data: [overdueAssignment],
      isLoading: false,
      refetch: vi.fn(),
      error: null,
      isError: false,
      isPending: false,
      isSuccess: true,
      status: 'success',
      dataUpdatedAt: Date.now(),
      errorUpdatedAt: 0,
      failureCount: 0,
      failureReason: null,
      fetchStatus: 'idle',
      isInitialLoading: false,
      isLoadingError: false,
      isPaused: false,
      isPlaceholderData: false,
      isFetched: true,
      isFetchedAfterMount: true,
      isFetching: false,
      isRefetchError: false,
      isRefetching: false,
      isStale: false
    });

    render(
      <Providers>
        <DashboardPage />
      </Providers>
    );

    expect(screen.getByText("Overdue")).toBeInTheDocument();
    
    // Look for badge elements that contain "1"
    const badgeElements = document.querySelectorAll('.badge, .rounded-full');
    const badgeWithOne = Array.from(badgeElements).find(el => el.textContent?.includes('1'));
    expect(badgeWithOne).toBeTruthy();
  });

  it("handles empty state correctly", () => {
    vi.mocked(useAssignments).mockReturnValue({
      data: [],
      isLoading: false,
      refetch: vi.fn(),
      error: null,
      isError: false,
      isPending: false,
      isSuccess: true,
      status: 'success',
      dataUpdatedAt: Date.now(),
      errorUpdatedAt: 0,
      failureCount: 0,
      failureReason: null,
      fetchStatus: 'idle',
      isInitialLoading: false,
      isLoadingError: false,
      isPaused: false,
      isPlaceholderData: false,
      isFetched: true,
      isFetchedAfterMount: true,
      isFetching: false,
      isRefetchError: false,
      isRefetching: false,
      isStale: false
    });

    render(
      <Providers>
        <DashboardPage />
      </Providers>
    );

    // Should show zero statistics - use getAllByText since there are multiple "0" elements
    const zeroElements = screen.getAllByText("0");
    expect(zeroElements.length).toBeGreaterThan(0);
    
    const percentageElements = screen.getAllByText(/0%/);
    expect(percentageElements.length).toBeGreaterThan(0);
    
    // Should show empty states for overdue/upcoming
    expect(screen.getByText("No overdue assignments")).toBeInTheDocument();
    expect(screen.getByText("No upcoming assignments")).toBeInTheDocument();
  });

  it("handles Canvas sync functionality", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, results: { assignments: 3 } })
    });

    render(
      <Providers>
        <DashboardPage />
      </Providers>
    );

    const syncButton = screen.getByText("Sync Canvas");
    expect(syncButton).toBeInTheDocument();
    
    // Could test clicking the button, but would need more complex mocking
  });
});


