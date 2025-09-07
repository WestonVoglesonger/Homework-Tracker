import { UserState } from "@/app/hooks/useUserState";

/**
 * Centralized Navigation Configuration
 *
 * Defines all navigation items, their permissions, and display logic
 */

export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon: string;
  description?: string;
  badge?: string | number;
  requiredStates?: UserState[];
  hiddenStates?: UserState[];
  external?: boolean;
  children?: NavigationItem[];
}

export interface NavigationSection {
  id: string;
  title?: string;
  items: NavigationItem[];
  requiredStates?: UserState[];
  hiddenStates?: UserState[];
}

// Main navigation configuration
export const navigationConfig: NavigationSection[] = [
  {
    id: "main",
    items: [
      {
        id: "dashboard",
        label: "Dashboard",
        href: "/dashboard",
        icon: "dashboard",
        description: "View your assignments and progress",
        requiredStates: ["authenticated", "authenticated_admin"],
      },
      {
        id: "courses",
        label: "Courses",
        href: "/courses",
        icon: "courses",
        description: "Manage your courses",
        requiredStates: ["authenticated", "authenticated_admin"],
      },
      {
        id: "calendar",
        label: "Calendar",
        href: "/calendar",
        icon: "calendar",
        description: "View assignments by date",
        requiredStates: ["authenticated", "authenticated_admin"],
      }
    ],
  },
  {
    id: "settings",
    title: "Account",
    items: [
      {
        id: "settings",
        label: "Settings",
        href: "/settings",
        icon: "settings",
        description: "Manage your account and preferences",
        requiredStates: ["authenticated", "authenticated_waitlisted", "authenticated_admin"],
      },
      {
        id: "admin",
        label: "Admin Panel",
        href: "/admin",
        icon: "admin",
        description: "System administration",
        requiredStates: ["authenticated_admin"],
      },
    ],
  },
];

// Authentication navigation (shown to unauthenticated users)
export const authNavigationConfig: NavigationItem[] = [
  {
    id: "signin",
    label: "Sign In",
    href: "/auth/signin",
    icon: "signin",
    hiddenStates: ["authenticated", "authenticated_waitlisted", "authenticated_admin"],
  },
  {
    id: "register",
    label: "Register",
    href: "/auth/register",
    icon: "register",
    hiddenStates: ["authenticated", "authenticated_waitlisted", "authenticated_admin"],
  },
];

// Footer navigation
export const footerNavigationConfig: NavigationItem[] = [
  {
    id: "privacy",
    label: "Privacy Policy",
    href: "/privacy",
    icon: "privacy",
    external: false,
  },
  {
    id: "terms",
    label: "Terms of Service",
    href: "/terms",
    icon: "terms",
    external: false,
  },
  {
    id: "data",
    label: "Your Data",
    href: "/data",
    icon: "data",
    external: false,
  },
];

// Helper functions for navigation logic

export function getVisibleNavigationItems(userState: UserState, config: NavigationSection[]): NavigationSection[] {
  return config
    .filter(section => {
      // Check section-level visibility
      if (section.hiddenStates?.includes(userState)) return false;
      if (section.requiredStates && !section.requiredStates.includes(userState)) return false;

      // Filter items within section
      section.items = section.items.filter(item => {
        if (item.hiddenStates?.includes(userState)) return false;
        if (item.requiredStates && !item.requiredStates.includes(userState)) return false;
        return true;
      });

      return section.items.length > 0;
    });
}

export function getVisibleAuthItems(userState: UserState): NavigationItem[] {
  return authNavigationConfig.filter(item => {
    if (item.hiddenStates?.includes(userState)) return false;
    if (item.requiredStates && !item.requiredStates.includes(userState)) return false;
    return true;
  });
}

export function getNavigationItemById(id: string, config: NavigationSection[] = navigationConfig): NavigationItem | null {
  for (const section of config) {
    const item = section.items.find(item => item.id === id);
    if (item) return item;
  }
  return null;
}

export function getBreadcrumbs(pathname: string): Array<{ label: string; href: string }> {
  const breadcrumbs: Array<{ label: string; href: string }> = [];
  const pathSegments = pathname.split('/').filter(Boolean);

  // Always include home/dashboard as first breadcrumb (unless we're already on dashboard)
  if (pathname !== "/dashboard") {
    breadcrumbs.push({
      label: "Dashboard",
      href: "/dashboard"
    });
  }

  // Add breadcrumbs based on path
  for (const segment of pathSegments) {
    // Find matching navigation item
    const navItem = getNavigationItemById(segment);
    if (navItem && navItem.href !== breadcrumbs[breadcrumbs.length - 1]?.href) {
      breadcrumbs.push({
        label: navItem.label,
        href: navItem.href
      });
    } else {
      // Handle dynamic routes
      if (segment === "courses" && pathSegments.includes("courses")) {
        const coursesHref = "/courses";
        if (coursesHref !== breadcrumbs[breadcrumbs.length - 1]?.href) {
          breadcrumbs.push({
            label: "Courses",
            href: coursesHref
          });
        }
      }
    }
  }

  return breadcrumbs;
}

export function getPageTitle(pathname: string): string {

  // Handle specific routes
  if (pathname === "/") return "DueNorth - Assignment Tracker";
  if (pathname === "/dashboard") return "Dashboard - DueNorth";
  if (pathname === "/courses") return "Courses - DueNorth";
  if (pathname === "/calendar") return "Calendar - DueNorth";
  if (pathname === "/settings") return "Settings - DueNorth";
  if (pathname === "/admin") return "Admin Panel - DueNorth";

  // Handle dynamic routes
  if (pathname.startsWith("/assignments/")) {
    return "Assignment Details - DueNorth";
  }
  if (pathname.startsWith("/courses/")) {
    return "Course Details - DueNorth";
  }
  if (pathname.startsWith("/auth/")) {
    return "Authentication - DueNorth";
  }

  return "DueNorth - Assignment Tracker";
}

export function getPageDescription(pathname: string): string {
  const descriptions: Record<string, string> = {
    "/": "Track your Canvas assignments with DueNorth - the smart assignment tracker for students.",
    "/dashboard": "View your assignments, track progress, and stay on top of deadlines.",
    "/courses": "Manage your courses and organize assignments by subject.",
    "/calendar": "See all your assignments in a calendar view to plan your schedule.",
    "/settings": "Configure your account, connect Canvas, and manage preferences.",
    "/admin": "System administration and user management.",
  };

  return descriptions[pathname] || "Manage your assignments and stay organized with DueNorth.";
}
