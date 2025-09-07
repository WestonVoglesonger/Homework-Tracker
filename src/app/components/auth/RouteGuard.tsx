import { ReactNode } from "react";
import { AuthGuard, RequireAuthentication, RequireCanvasAccess, RequireAdminAccess, PublicOnlyGuard, WaitlistGuard } from "./AuthGuard";

/**
 * RouteGuard Components
 *
 * Pre-configured route guards for common scenarios
 */

// Public routes (landing page, auth pages)
export function PublicRoute({ children }: { children: ReactNode }) {
  return <PublicOnlyGuard>{children}</PublicOnlyGuard>;
}

// Protected routes (dashboard, courses, calendar, settings)
export function ProtectedRoute({ children }: { children: ReactNode }) {
  return <RequireAuthentication>{children}</RequireAuthentication>;
}

// Canvas-required routes (dashboard, courses, calendar)
export function CanvasRoute({ children }: { children: ReactNode }) {
  return <RequireCanvasAccess>{children}</RequireCanvasAccess>;
}

// Admin-only routes
export function AdminRoute({ children }: { children: ReactNode }) {
  return <RequireAdminAccess>{children}</RequireAdminAccess>;
}

// Routes that show waitlist content for waitlisted users
export function WaitlistAwareRoute({
  children,
  waitlistContent
}: {
  children: ReactNode;
  waitlistContent?: ReactNode;
}) {
  return (
    <RequireAuthentication>
      <WaitlistGuard waitlistContent={waitlistContent}>
        {children}
      </WaitlistGuard>
    </RequireAuthentication>
  );
}

// Routes that allow both authenticated and waitlisted users
export function FlexibleAuthRoute({ children }: { children: ReactNode }) {
  return (
    <AuthGuard requiredState={["authenticated", "authenticated_waitlisted", "authenticated_admin"]}>
      {children}
    </AuthGuard>
  );
}

/**
 * Higher-Order Components for Pages
 *
 * These can be used to wrap entire page components
 */

export function withPublicRoute<P extends object>(Component: React.ComponentType<P>) {
  return function PublicPage(props: P) {
    return (
      <PublicRoute>
        <Component {...props} />
      </PublicRoute>
    );
  };
}

export function withProtectedRoute<P extends object>(Component: React.ComponentType<P>) {
  return function ProtectedPage(props: P) {
    return (
      <ProtectedRoute>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}

export function withCanvasRoute<P extends object>(Component: React.ComponentType<P>) {
  return function CanvasPage(props: P) {
    return (
      <CanvasRoute>
        <Component {...props} />
      </CanvasRoute>
    );
  };
}

export function withAdminRoute<P extends object>(Component: React.ComponentType<P>) {
  return function AdminPage(props: P) {
    return (
      <AdminRoute>
        <Component {...props} />
      </AdminRoute>
    );
  };
}

export function withWaitlistAwareRoute<P extends object>(
  Component: React.ComponentType<P>,
  waitlistContent?: ReactNode
) {
  return function WaitlistAwarePage(props: P) {
    return (
      <WaitlistAwareRoute waitlistContent={waitlistContent}>
        <Component {...props} />
      </WaitlistAwareRoute>
    );
  };
}

export function withFlexibleAuthRoute<P extends object>(Component: React.ComponentType<P>) {
  return function FlexibleAuthPage(props: P) {
    return (
      <FlexibleAuthRoute>
        <Component {...props} />
      </FlexibleAuthRoute>
    );
  };
}
