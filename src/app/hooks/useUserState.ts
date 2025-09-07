import { useSession } from "next-auth/react";
import { useAdmin } from "./useAdmin";

/**
 * User State Management Hook
 *
 * Centralizes all user state logic for the 4 main user states:
 * 1. Not Authenticated
 * 2. Authenticated
 * 3. Authenticated and Waitlisted
 * 4. Authenticated and Admin
 */

export type UserState =
  | "not_authenticated"
  | "authenticated"
  | "authenticated_waitlisted"
  | "authenticated_admin";

export interface UserStateInfo {
  state: UserState;
  isLoading: boolean;
  isAuthenticated: boolean;
  isWaitlisted: boolean;
  isAdmin: boolean;
  user: {
    id: string;
    isWaitlisted?: boolean;
    isAdmin?: boolean;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
  canAccessProtectedRoutes: boolean;
  canAccessAdminRoutes: boolean;
  canUseCanvasFeatures: boolean;
}

export function useUserState(): UserStateInfo {
  const { data: session, status } = useSession();
  const { isAdmin, isAdminLoading } = useAdmin();

  const isLoading = status === "loading" || (status === "authenticated" && isAdminLoading);
  const isAuthenticated = status === "authenticated";
  const isWaitlisted = Boolean((session?.user as { isWaitlisted?: boolean } | undefined)?.isWaitlisted);

  // Determine the current user state
  let state: UserState;
  if (!isAuthenticated) {
    state = "not_authenticated";
  } else if (isAdmin) {
    state = "authenticated_admin";
  } else if (isWaitlisted) {
    state = "authenticated_waitlisted";
  } else {
    state = "authenticated";
  }

  // Determine capabilities based on state
  const canAccessProtectedRoutes = isAuthenticated && !isWaitlisted;
  const canAccessAdminRoutes = state === "authenticated_admin";
  const canUseCanvasFeatures = state === "authenticated" || state === "authenticated_admin";

  return {
    state,
    isLoading,
    isAuthenticated,
    isWaitlisted,
    isAdmin: Boolean(isAdmin),
    user: session?.user ?? null,
    canAccessProtectedRoutes,
    canAccessAdminRoutes,
    canUseCanvasFeatures,
  };
}

/**
 * Hook for checking if user can access a specific route
 */
export function useRouteAccess(requiredState?: UserState | UserState[]) {
  const userState = useUserState();

  if (!requiredState) {
    return {
      canAccess: true,
      redirectTo: null,
      reason: null,
    };
  }

  const allowedStates = Array.isArray(requiredState) ? requiredState : [requiredState];

  if (userState.isLoading) {
    return {
      canAccess: false,
      redirectTo: null,
      reason: "loading",
    };
  }

  if (!allowedStates.includes(userState.state)) {
    let redirectTo: string | null = null;
    let reason: string = "insufficient_permissions";

    switch (userState.state) {
      case "not_authenticated":
        redirectTo = "/auth/signin";
        reason = "authentication_required";
        break;
      case "authenticated_waitlisted":
        redirectTo = "/";
        reason = "waitlist_restriction";
        break;
      case "authenticated":
        if (allowedStates.includes("authenticated_admin")) {
          redirectTo = "/admin/auth";
          reason = "admin_required";
        }
        break;
    }

    return {
      canAccess: false,
      redirectTo,
      reason,
    };
  }

  return {
    canAccess: true,
    redirectTo: null,
    reason: null,
  };
}

/**
 * Hook for getting user state-specific UI content
 */
export function useUserStateUI() {
  const userState = useUserState();

  const getNavigationItems = () => {
    switch (userState.state) {
      case "not_authenticated":
        return [];
      case "authenticated_waitlisted":
        return [
          { href: "/settings", label: "Settings", icon: "settings" },
        ];
      case "authenticated":
      case "authenticated_admin":
        const items = [
          { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
          { href: "/courses", label: "Courses", icon: "courses" },
          { href: "/calendar", label: "Calendar", icon: "calendar" },
          { href: "/settings", label: "Settings", icon: "settings" },
        ];
        if (userState.isAdmin) {
          items.push({ href: "/admin", label: "Admin Panel", icon: "admin" });
        }
        return items;
    }
  };

  const getUserMessage = () => {
    switch (userState.state) {
      case "authenticated_waitlisted":
        return {
          title: "You're on the Waitlist!",
          message: "Thank you for your interest. You'll be notified when your account is activated.",
          type: "info" as const,
        };
      case "authenticated_admin":
        return {
          title: "Admin Access",
          message: "You have administrative privileges.",
          type: "success" as const,
        };
      default:
        return null;
    }
  };

  const getAvailableActions = () => {
    switch (userState.state) {
      case "not_authenticated":
        return ["signin", "register"];
      case "authenticated_waitlisted":
        return ["settings", "delete_account"];
      case "authenticated":
        return ["all_features", "settings", "delete_account"];
      case "authenticated_admin":
        return ["all_features", "admin_panel", "settings", "delete_account"];
    }
  };

  return {
    navigationItems: getNavigationItems(),
    userMessage: getUserMessage(),
    availableActions: getAvailableActions(),
    canShowCanvasFeatures: userState.canUseCanvasFeatures,
    canShowAdminFeatures: userState.canAccessAdminRoutes,
  };
}
