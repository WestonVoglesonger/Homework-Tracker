import { ReactNode } from "react";
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from "lucide-react";
import { Button } from "./button";

export type ErrorSeverity = "error" | "warning" | "info" | "success";

interface ErrorDisplayProps {
  title?: string;
  message: string;
  severity?: ErrorSeverity;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: "default" | "outline" | "secondary";
  }>;
  onDismiss?: () => void;
  className?: string;
  icon?: ReactNode;
}

/**
 * Centralized Error Display Component
 *
 * Consistent error, warning, info, and success message display
 */
export function ErrorDisplay({
  title,
  message,
  severity = "error",
  actions = [],
  onDismiss,
  className = "",
  icon
}: ErrorDisplayProps) {
  const getSeverityStyles = () => {
    switch (severity) {
      case "error":
        return {
          bg: "bg-red-50 dark:bg-red-900/20",
          border: "border-red-200 dark:border-red-800",
          text: "text-red-800 dark:text-red-200",
          icon: <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
        };
      case "warning":
        return {
          bg: "bg-yellow-50 dark:bg-yellow-900/20",
          border: "border-yellow-200 dark:border-yellow-800",
          text: "text-yellow-800 dark:text-yellow-200",
          icon: <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
        };
      case "info":
        return {
          bg: "bg-blue-50 dark:bg-blue-900/20",
          border: "border-blue-200 dark:border-blue-800",
          text: "text-blue-800 dark:text-blue-200",
          icon: <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        };
      case "success":
        return {
          bg: "bg-green-50 dark:bg-green-900/20",
          border: "border-green-200 dark:border-green-800",
          text: "text-green-800 dark:text-green-200",
          icon: <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
        };
    }
  };

  const styles = getSeverityStyles();

  return (
    <div className={`p-4 rounded-lg border ${styles.bg} ${styles.border} ${className}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {icon || styles.icon}
        </div>
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className={`text-sm font-medium ${styles.text} mb-1`}>
              {title}
            </h4>
          )}
          <p className={`text-sm ${styles.text}`}>
            {message}
          </p>
          {actions.length > 0 && (
            <div className="flex gap-2 mt-3">
              {actions.map((action, index) => (
                <Button
                  key={index}
                  variant={action.variant || "outline"}
                  size="sm"
                  onClick={action.onClick}
                  className="text-xs"
                >
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className={`flex-shrink-0 p-1 rounded-md hover:bg-black/10 dark:hover:bg-white/10 transition-colors ${styles.text}`}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Pre-configured Error Components
 */

export function NetworkError({
  onRetry,
  className = ""
}: {
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <ErrorDisplay
      title="Connection Error"
      message="Unable to connect to the server. Please check your internet connection and try again."
      severity="error"
      actions={onRetry ? [{ label: "Try Again", onClick: onRetry }] : []}
      className={className}
    />
  );
}

export function ValidationError({
  message,
  className = ""
}: {
  message: string;
  className?: string;
}) {
  return (
    <ErrorDisplay
      message={message}
      severity="warning"
      className={className}
    />
  );
}

export function SuccessMessage({
  title = "Success",
  message,
  onDismiss,
  className = ""
}: {
  title?: string;
  message: string;
  onDismiss?: () => void;
  className?: string;
}) {
  return (
    <ErrorDisplay
      title={title}
      message={message}
      severity="success"
      onDismiss={onDismiss}
      className={className}
    />
  );
}

/**
 * Error Boundary Component
 *
 * Catches JavaScript errors anywhere in the component tree
 */
import { Component, ErrorInfo, ReactElement } from "react";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, errorInfo: ErrorInfo) => ReactElement;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo });
    this.props.onError?.(error, errorInfo);

    // Log error to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("Error Boundary caught an error:", error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.state.errorInfo!);
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <ErrorDisplay
            title="Something went wrong"
            message="An unexpected error occurred. Please refresh the page and try again."
            severity="error"
            actions={[
              {
                label: "Refresh Page",
                onClick: () => window.location.reload()
              }
            ]}
          />
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook for handling async operations with error states
 */
import { useState, useCallback } from "react";

export function useAsyncError() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const execute = useCallback(async <T,>(
    asyncFn: () => Promise<T>,
    onSuccess?: (result: T) => void,
    onError?: (error: Error) => void
  ): Promise<T | null> => {
    setError(null);
    setIsLoading(true);

    try {
      const result = await asyncFn();
      onSuccess?.(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
      onError?.(err instanceof Error ? err : new Error(errorMessage));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    error,
    isLoading,
    execute,
    clearError,
    setError
  };
}
