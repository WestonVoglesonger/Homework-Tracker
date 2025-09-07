import { useCallback } from "react";
import { useNotifications } from "./useNotifications";

/**
 * Centralized Error Handler Hook
 *
 * Provides consistent error handling across the application
 */

export interface ErrorContext {
  operation: string;
  userId?: string;
  resourceId?: string;
  additionalData?: Record<string, unknown>;
}

export function useErrorHandler() {
  const { error: notifyError, success: notifySuccess } = useNotifications();

  const handleError = useCallback((error: Error | string, context?: ErrorContext) => {
    const errorMessage = error instanceof Error ? error.message : error;

    // Log error for monitoring (you can integrate with your error logging service)
    console.error("Error handled:", {
      message: errorMessage,
      context,
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== "undefined" ? window.navigator.userAgent : "server",
    });

    // Determine error type and show appropriate message
    let userMessage = "An unexpected error occurred. Please try again.";

    if (errorMessage.includes("network") || errorMessage.includes("fetch")) {
      userMessage = "Network error. Please check your connection and try again.";
    } else if (errorMessage.includes("unauthorized") || errorMessage.includes("401")) {
      userMessage = "You need to sign in to continue.";
    } else if (errorMessage.includes("forbidden") || errorMessage.includes("403")) {
      userMessage = "You don't have permission to perform this action.";
    } else if (errorMessage.includes("not found") || errorMessage.includes("404")) {
      userMessage = "The requested resource was not found.";
    } else if (errorMessage.includes("validation")) {
      userMessage = errorMessage; // Use the validation message as-is
    } else if (errorMessage.includes("Canvas")) {
      userMessage = "Canvas integration error. Please check your Canvas connection.";
    }

    notifyError(userMessage, {
      title: getErrorTitle(context?.operation),
    });

    return userMessage;
  }, [notifyError]);

  const handleSuccess = useCallback((message: string, context?: ErrorContext) => {
    notifySuccess(message, {
      title: getSuccessTitle(context?.operation),
    });
  }, [notifySuccess]);

  const wrapAsync = useCallback(async <T,>(
    asyncFn: () => Promise<T>,
    context?: ErrorContext
  ): Promise<T | null> => {
    try {
      const result = await asyncFn();
      return result;
    } catch (error) {
      handleError(error instanceof Error ? error : new Error(String(error)), context);
      return null;
    }
  }, [handleError]);

  const validateForm = useCallback((data: Record<string, unknown>, rules: Record<string, (value: unknown) => string | null>) => {
    const errors: Record<string, string> = {};

    for (const [field, validator] of Object.entries(rules)) {
      const error = validator(data[field]);
      if (error) {
        errors[field] = error;
      }
    }

    if (Object.keys(errors).length > 0) {
      const firstError = Object.values(errors)[0];
      handleError(`Validation error: ${firstError}`, { operation: "form_validation" });
      return { isValid: false, errors };
    }

    return { isValid: true, errors: {} };
  }, [handleError]);

  return {
    handleError,
    handleSuccess,
    wrapAsync,
    validateForm,
  };
}

/**
 * Helper Functions
 */

function getErrorTitle(operation?: string): string | undefined {
  if (!operation) return undefined;

  const titles: Record<string, string> = {
    login: "Sign In Failed",
    register: "Registration Failed",
    create_assignment: "Failed to Create Assignment",
    update_assignment: "Failed to Update Assignment",
    delete_assignment: "Failed to Delete Assignment",
    create_course: "Failed to Create Course",
    update_course: "Failed to Update Course",
    delete_course: "Failed to Delete Course",
    canvas_sync: "Canvas Sync Failed",
    export_data: "Export Failed",
    form_validation: "Validation Error",
  };

  return titles[operation] || "Operation Failed";
}

function getSuccessTitle(operation?: string): string | undefined {
  if (!operation) return undefined;

  const titles: Record<string, string> = {
    login: "Welcome Back!",
    register: "Account Created",
    create_assignment: "Assignment Created",
    update_assignment: "Assignment Updated",
    delete_assignment: "Assignment Deleted",
    create_course: "Course Created",
    update_course: "Course Updated",
    delete_course: "Course Deleted",
    canvas_sync: "Canvas Synced",
    export_data: "Export Complete",
  };

  return titles[operation] || "Success";
}

/**
 * Common Validation Rules
 */

export const validationRules = {
  required: (value: unknown) => {
    if (!value || (typeof value === "string" && value.trim() === "")) {
      return "This field is required";
    }
    return null;
  },

  email: (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!value || !emailRegex.test(value)) {
      return "Please enter a valid email address";
    }
    return null;
  },

  minLength: (min: number) => (value: string) => {
    if (!value || value.length < min) {
      return `Must be at least ${min} characters long`;
    }
    return null;
  },

  maxLength: (max: number) => (value: string) => {
    if (value && value.length > max) {
      return `Must be no more than ${max} characters long`;
    }
    return null;
  },

  password: (value: string) => {
    if (!value || value.length < 8) {
      return "Password must be at least 8 characters long";
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
      return "Password must contain at least one uppercase letter, one lowercase letter, and one number";
    }
    return null;
  },

  url: (value: string) => {
    try {
      new URL(value);
      return null;
    } catch {
      return "Please enter a valid URL";
    }
  },

  date: (value: string) => {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return "Please enter a valid date";
    }
    return null;
  },

  futureDate: (value: string) => {
    const date = new Date(value);
    const now = new Date();
    if (date <= now) {
      return "Date must be in the future";
    }
    return null;
  },
};

/**
 * API Error Handler
 *
 * Handles common API error responses
 */
export function handleApiError(error: Error | unknown): string {
  if (!error) return "An unexpected error occurred";

  // Handle fetch errors
  if (error instanceof Error && error.name === "TypeError" && error.message.includes("fetch")) {
    return "Network error. Please check your connection and try again.";
  }

  // Handle HTTP errors
  const httpError = error as { status?: number; message?: string };
  if (httpError.status) {
    switch (httpError.status) {
      case 400:
        return "Invalid request. Please check your input and try again.";
      case 401:
        return "You need to sign in to continue.";
      case 403:
        return "You don't have permission to perform this action.";
      case 404:
        return "The requested resource was not found.";
      case 409:
        return "This action conflicts with existing data.";
      case 422:
        return "Validation failed. Please check your input.";
      case 429:
        return "Too many requests. Please wait a moment and try again.";
      case 500:
      case 502:
      case 503:
      case 504:
        return "Server error. Please try again later.";
      default:
        return `Error ${httpError.status}: ${httpError.message || "Something went wrong"}`;
    }
  }

  // Handle error objects with message property
  if (error instanceof Error && error.message) {
    return error.message;
  }

  // Handle string errors
  if (typeof error === "string") {
    return error;
  }

  return "An unexpected error occurred. Please try again.";
}
