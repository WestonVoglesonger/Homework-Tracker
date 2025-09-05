import { getErrorLogService, getAnalyticsService } from "@/services/container/ServiceContainer";
import type { NextRequest } from "next/server";

// Global error handler for API routes
export async function withErrorLogging<T>(
  req: NextRequest,
  handler: () => Promise<T>,
  userId?: string,
  endpoint?: string
): Promise<T> {
  try {
    // Track the API call using OOP service
    if (endpoint) {
      const { default: prisma } = await import("@/db/client");
      const analyticsService = getAnalyticsService(prisma);
      await analyticsService.trackUserActivity(userId || 'anonymous', `API: ${req.method} ${endpoint}`);
    }

    return await handler();
  } catch (error) {
    // Log the error using OOP service
    const { default: prisma } = await import("@/db/client");
    const errorLogService = getErrorLogService(prisma);
    await errorLogService.logApiError(endpoint || req.url, req.method, error as Error, userId);
    throw error;
  }
}

// Global error boundary for client-side errors (temporarily disabled to prevent infinite loops)
export function setupGlobalErrorHandler() {
  if (typeof window !== "undefined") {
    // Capture unhandled promise rejections
    window.addEventListener("unhandledrejection", async (event) => {
      const { default: prisma } = await import("@/db/client");
      const errorLogService = getErrorLogService(prisma);
      await errorLogService.logError({
        message: `Unhandled promise rejection: ${event.reason}`,
        stack: event.reason instanceof Error ? event.reason.stack : undefined,
        metadata: { type: 'unhandled_rejection' }
      });
    });

    // Capture global errors
    window.addEventListener("error", async (event) => {
      const { default: prisma } = await import("@/db/client");
      const errorLogService = getErrorLogService(prisma);
      await errorLogService.logError({
        message: event.message,
        stack: event.error?.stack,
        path: window.location.pathname,
        userAgent: navigator.userAgent,
        metadata: {
          type: "global_error",
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        }
      });
    });

    // Override console.error to capture manual errors (temporarily disabled)
    // const originalConsoleError = console.error;
    // console.error = async (...args: any[]) => {
    //   originalConsoleError(...args);

    //   const message = args.map(arg =>
    //     typeof arg === "object" ? JSON.stringify(arg) : String(arg)
    //   ).join(" ");

    //   await logError("ERROR", `Console error: ${message}`, undefined, {
    //     endpoint: window.location.pathname,
    //   });
    // };
  }
}
