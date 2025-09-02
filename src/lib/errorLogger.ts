import { logApiError, logError } from "@/services/errorLogService";
import { trackApiCall } from "@/services/analyticsService";
import type { NextRequest } from "next/server";

// Global error handler for API routes
export async function withErrorLogging<T>(
  req: NextRequest,
  handler: () => Promise<T>,
  userId?: string,
  endpoint?: string
): Promise<T> {
  try {
    // Track the API call
    if (endpoint) {
      await trackApiCall(endpoint, req.method, req, userId);
    }

    return await handler();
  } catch (error) {
    // Log the error
    await logApiError(req, error as Error, userId);
    throw error;
  }
}

// Global error boundary for client-side errors (temporarily disabled to prevent infinite loops)
export function setupGlobalErrorHandler() {
  if (typeof window !== "undefined") {
    // Capture unhandled promise rejections
    window.addEventListener("unhandledrejection", async (event) => {
      await logError("ERROR", `Unhandled promise rejection: ${event.reason}`, 
        event.reason instanceof Error ? event.reason : new Error(String(event.reason)));
    });

    // Capture global errors
    window.addEventListener("error", async (event) => {
      await logError("ERROR", event.message, event.error, {
        endpoint: window.location.pathname,
        additionalData: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
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
