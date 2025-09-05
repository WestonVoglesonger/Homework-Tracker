import { vi } from "vitest";
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { TestUser } from "./factories";

// Mock Next.js Request for API testing
export function createMockRequest(
  method: string = "GET",
  url: string = "http://localhost:3000/api/test",
  body?: any,
  headers?: Record<string, string>
): NextRequest {
  const requestInit: RequestInit & { signal?: AbortSignal } = {
    method,
    headers: {
      'content-type': 'application/json',
      ...headers,
    },
  };

  if (body && method !== "GET") {
    requestInit.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  return new NextRequest(url, requestInit as any);
}

// Mock authenticated session
export function mockAuthenticatedSession(user: TestUser): Session {
  return {
    user: {
      id: user.id,
      email: user.email!,
      name: user.name,
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
  };
}

// Mock NextAuth getServerSession
export function mockGetServerSession(session: Session | null) {
  vi.mocked(getServerSession).mockResolvedValue(session);
}

// Test error classes
export class TestAssertionError extends Error {
  constructor(message: string, expected?: any, actual?: any) {
    super(`Assertion failed: ${message}${expected !== undefined ? `\nExpected: ${JSON.stringify(expected)}\nActual: ${JSON.stringify(actual)}` : ''}`);
    this.name = 'TestAssertionError';
  }
}

// Response assertion helpers
export function assertSuccessResponse(response: Response, expectedStatus: number = 200) {
  if (response.status !== expectedStatus) {
    throw new TestAssertionError(
      `Expected response status ${expectedStatus} but got ${response.status}`,
      expectedStatus,
      response.status
    );
  }
}

export function assertErrorResponse(
  response: Response, 
  expectedStatus: number,
  expectedMessage?: string
) {
  if (response.status !== expectedStatus) {
    throw new TestAssertionError(
      `Expected error status ${expectedStatus} but got ${response.status}`,
      expectedStatus,
      response.status
    );
  }

  if (expectedMessage && response.statusText && !response.statusText.includes(expectedMessage)) {
    throw new TestAssertionError(
      `Expected error message to contain "${expectedMessage}"`,
      expectedMessage,
      response.statusText
    );
  }
}

// Date utilities for testing
export function createDateDaysFromNow(days: number): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

export function createDateDaysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

// Mock external services
export function mockCanvasApi() {
  const mockFetch = vi.fn();
  
  // Mock successful Canvas course response
  mockFetch.mockImplementation((url: string) => {
    if (url.includes('/api/v1/courses')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([
          {
            id: 12345,
            name: "Test Canvas Course",
            course_code: "TEST101",
            term: { name: "Fall 2024" },
          }
        ])
      });
    }
    
    if (url.includes('/assignments')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([
          {
            id: 67890,
            name: "Canvas Assignment 1",
            description: "<p>Canvas assignment description</p>",
            due_at: "2024-12-31T23:59:59Z",
            html_url: "https://canvas.example.com/assignments/67890",
          }
        ])
      });
    }

    return Promise.resolve({ ok: false, status: 404 });
  });

  global.fetch = mockFetch;
  return mockFetch;
}

export function restoreCanvasApi() {
  vi.restoreAllMocks();
}

// Email service mocks
export function mockEmailService() {
  const mockSendEmail = vi.fn().mockResolvedValue({ success: true });
  
  vi.doMock('@/services/emailService', () => ({
    sendVerificationEmail: mockSendEmail,
    sendPasswordResetEmail: mockSendEmail,
  }));
  
  return { mockSendEmail };
}

// Wait utilities for async testing
export function waitFor(condition: () => boolean, timeout: number = 5000): Promise<void> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const checkCondition = () => {
      if (condition()) {
        resolve();
      } else if (Date.now() - startTime >= timeout) {
        reject(new Error(`Condition not met within ${timeout}ms timeout`));
      } else {
        setTimeout(checkCondition, 100);
      }
    };
    
    checkCondition();
  });
}

export async function waitForMs(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Database query helpers
export async function assertRecordExists<T>(
  queryFn: () => Promise<T | null>,
  errorMessage: string = "Expected record to exist"
): Promise<T> {
  const record = await queryFn();
  if (!record) {
    throw new TestAssertionError(errorMessage);
  }
  return record;
}

export async function assertRecordDoesNotExist<T>(
  queryFn: () => Promise<T | null>,
  errorMessage: string = "Expected record to not exist"
): Promise<void> {
  const record = await queryFn();
  if (record) {
    throw new TestAssertionError(errorMessage, null, record);
  }
}

// Console output capturing for tests
export function captureConsoleOutput() {
  const originalLog = console.log;
  const originalError = console.error;
  const logs: string[] = [];
  const errors: string[] = [];

  console.log = (...args: any[]) => {
    logs.push(args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' '));
  };

  console.error = (...args: any[]) => {
    errors.push(args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' '));
  };

  return {
    getLogs: () => [...logs],
    getErrors: () => [...errors],
    restore: () => {
      console.log = originalLog;
      console.error = originalError;
    }
  };
}
