"use client";
import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserState, UserState } from "@/app/hooks/useUserState";
import { LoadingSpinner } from "@/app/components/ui/LoadingState";
import { Spinner } from "@/app/components/ui/spinner";

interface AuthGuardProps {
  children: ReactNode;
  requiredState?: UserState | UserState[];
  fallback?: ReactNode;
  redirectOnFail?: boolean;
  loadingComponent?: ReactNode;
}

/**
 * AuthGuard Component
 *
 * Centralized authentication and authorization guard that handles all user states
 * and redirects or shows appropriate content based on user permissions.
 */
export function AuthGuard({
  children,
  requiredState,
  fallback,
  redirectOnFail = true,
  loadingComponent,
}: AuthGuardProps) {
  const userState = useUserState();
  const router = useRouter();
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [redirectPath, setRedirectPath] = useState("/");

  // Handle redirect - must be called before any early returns
  useEffect(() => {
    if (shouldRedirect) {
      router.push(redirectPath);
    }
  }, [shouldRedirect, redirectPath, router]);

  const defaultLoadingComponent = (
    <div className="min-h-screen grid place-items-center">
      <Spinner size={48} className="text-gray-500" />
    </div>
  );

  const defaultFallback = (
    <div className="min-h-screen grid place-items-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Access Denied
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          You don&apos;t have permission to access this page.
        </p>
      </div>
    </div>
  );

  // Handle loading state
  if (userState.isLoading) {
    return loadingComponent || <LoadingSpinner size={48} className="text-gray-500" fullScreen />;
  }

  // Check if user has required state
  if (requiredState) {
    const allowedStates = Array.isArray(requiredState) ? requiredState : [requiredState];

    if (!allowedStates.includes(userState.state)) {
      if (redirectOnFail) {
        // Determine where to redirect based on current state
        let path = "/";

        switch (userState.state) {
          case "not_authenticated":
            path = "/auth/signin";
            break;
          case "authenticated_waitlisted":
            path = "/";
            break;
          case "authenticated":
            if (allowedStates.includes("authenticated_admin")) {
              path = "/admin/auth";
            }
            break;
        }

        // Set redirect state to trigger useEffect
        if (!shouldRedirect) {
          setShouldRedirect(true);
          setRedirectPath(path);
        }

        return loadingComponent || defaultLoadingComponent;
      }

      return fallback || defaultFallback;
    }
  }

  return <>{children}</>;
}

/**
 * Higher-order component for protecting entire pages
 */
export function withAuthGuard<P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<AuthGuardProps, "children">
) {
  return function ProtectedComponent(props: P) {
    return (
      <AuthGuard {...options}>
        <Component {...props} />
      </AuthGuard>
    );
  };
}

/**
 * Convenience components for common use cases
 */

export function RequireAuthentication({ children, ...props }: Omit<AuthGuardProps, "requiredState">) {
  return (
    <AuthGuard requiredState={["authenticated", "authenticated_waitlisted", "authenticated_admin"]} {...props}>
      {children}
    </AuthGuard>
  );
}

export function RequireCanvasAccess({ children, ...props }: Omit<AuthGuardProps, "requiredState">) {
  return (
    <AuthGuard requiredState={["authenticated", "authenticated_admin"]} {...props}>
      {children}
    </AuthGuard>
  );
}

export function RequireAdminAccess({ children, ...props }: Omit<AuthGuardProps, "requiredState">) {
  return (
    <AuthGuard requiredState="authenticated_admin" {...props}>
      {children}
    </AuthGuard>
  );
}

/**
 * AuthRedirect Component
 *
 * Handles redirects based on user state without rendering children
 */
export function AuthRedirect() {
  const userState = useUserState();
  const router = useRouter();

  useEffect(() => {
    if (userState.isLoading) return;

    let redirectPath = "/";

    switch (userState.state) {
      case "not_authenticated":
        redirectPath = "/auth/signin";
        break;
      case "authenticated_waitlisted":
        redirectPath = "/";
        break;
      case "authenticated":
        redirectPath = "/dashboard";
        break;
      case "authenticated_admin":
        redirectPath = "/admin";
        break;
    }

    router.replace(redirectPath);
  }, [userState.isLoading, userState.state, router]);

  return <LoadingSpinner size={48} className="text-gray-500" fullScreen />;
}

/**
 * PublicOnlyGuard Component
 *
 * Only renders children for unauthenticated users, redirects authenticated users
 */
export function PublicOnlyGuard({
  children,
  redirectTo = "/dashboard"
}: {
  children: ReactNode;
  redirectTo?: string;
}) {
  const userState = useUserState();
  const router = useRouter();

  // Debug logs were used during investigation; strip down to production-friendly behavior

  useEffect(() => {
    if (userState.isLoading) return;

    if (userState.isAuthenticated) {
      // eslint-disable-next-line no-console
      console.log("[PublicOnlyGuard] redirecting", { redirectTo });
      router.replace(redirectTo);
    }
  }, [userState.isLoading, userState.isAuthenticated, router, redirectTo]);

  if (userState.isLoading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="flex flex-col items-center gap-2">
          <LoadingSpinner size={48} className="text-gray-500" />
          <div className="text-xs text-gray-500">
            Auth Debug: loading=true, authenticated={String(userState.isAuthenticated)}, state={userState.state}
          </div>
        </div>
      </div>
    );
  }

  if (userState.isAuthenticated) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="flex flex-col items-center gap-2">
          <LoadingSpinner size={48} className="text-gray-500" />
          <div className="text-xs text-gray-500">Auth Debug: redirecting to {redirectTo}</div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * WaitlistGuard Component
 *
 * Shows waitlist content for waitlisted users, otherwise renders children
 */
export function WaitlistGuard({
  children,
  waitlistContent
}: {
  children: ReactNode;
  waitlistContent?: ReactNode;
}) {
  const userState = useUserState();

  if (userState.isLoading) {
    return <LoadingSpinner size={48} className="text-gray-500" fullScreen />;
  }

  if (userState.isWaitlisted) {
    return waitlistContent || (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            You&apos;re on the Waitlist!
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            You&apos;ll be notified when your account is activated.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
