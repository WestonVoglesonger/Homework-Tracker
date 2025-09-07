"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUserState } from "@/app/hooks/useUserState";
import {
  navigationConfig,
  getVisibleNavigationItems,
  getVisibleAuthItems,
  getBreadcrumbs,
  NavigationItem
} from "./NavigationConfig";

/**
 * Enhanced Navigation Component
 *
 * Provides comprehensive navigation with active states, breadcrumbs, and user state awareness
 */

interface NavigationLinkProps {
  item: NavigationItem;
  isActive?: boolean;
  mobile?: boolean;
  onClick?: () => void;
}

function NavigationLink({ item, isActive, mobile, onClick }: NavigationLinkProps) {
  const baseClasses = mobile
    ? "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-900/20 dark:hover:text-blue-300"
    : "group flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-900/20 dark:hover:text-blue-300";

  const activeClasses = isActive
    ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
    : "text-gray-700 dark:text-gray-300";

  const linkContent = (
    <>
      <NavigationIcon icon={item.icon} />
      <span>{item.label}</span>
      {item.badge && (
        <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">
          {item.badge}
        </span>
      )}
    </>
  );

  if (item.external) {
    return (
      <a
        href={item.href}
        className={`${baseClasses} ${activeClasses}`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onClick}
      >
        {linkContent}
      </a>
    );
  }

  return (
    <Link
      href={item.href}
      className={`${baseClasses} ${activeClasses}`}
      onClick={onClick}
    >
      {linkContent}
    </Link>
  );
}

function NavigationIcon({ icon }: { icon: string }) {
  const iconClasses = "w-2 h-2 rounded-full";

  switch (icon) {
    case "dashboard":
      return <div className={`${iconClasses} bg-blue-500`} />;
    case "courses":
      return <div className={`${iconClasses} bg-green-500`} />;
    case "calendar":
      return <div className={`${iconClasses} bg-purple-500`} />;
    case "assignments":
      return <div className={`${iconClasses} bg-orange-500`} />;
    case "settings":
      return <div className={`${iconClasses} bg-gray-500`} />;
    case "admin":
      return <div className={`${iconClasses} bg-red-500`} />;
    case "signin":
    case "register":
      return <div className={`${iconClasses} bg-blue-500`} />;
    default:
      return <div className={`${iconClasses} bg-gray-400`} />;
  }
}

/**
 * Main Navigation Component
 */
export function EnhancedNavigation({ mobile = false }: { mobile?: boolean }) {
  const { state: userState } = useUserState();
  const pathname = usePathname();

  const visibleSections = getVisibleNavigationItems(userState, navigationConfig);
  const visibleAuthItems = getVisibleAuthItems(userState);

  if (mobile) {
    return (
      <nav className="flex flex-col gap-2">
        {visibleSections.map(section => (
          <div key={section.id}>
            {section.title && (
              <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {section.title}
              </div>
            )}
            {section.items.map(item => (
              <NavigationLink
                key={item.id}
                item={item}
                isActive={pathname === item.href}
                mobile
              />
            ))}
          </div>
        ))}

        {visibleAuthItems.length > 0 && (
          <>
            <div className="border-t border-gray-200 dark:border-gray-700 my-2" />
            {visibleAuthItems.map(item => (
              <NavigationLink
                key={item.id}
                item={item}
                mobile
              />
            ))}
          </>
        )}
      </nav>
    );
  }

  return (
    <nav className="flex flex-col gap-2 mt-6">
      {visibleSections.map(section => (
        <div key={section.id}>
          {section.title && (
            <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {section.title}
            </div>
          )}
          {section.items.map(item => (
            <NavigationLink
              key={item.id}
              item={item}
              isActive={pathname === item.href}
            />
          ))}
        </div>
      ))}
    </nav>
  );
}

/**
 * Breadcrumb Navigation Component
 */
export function BreadcrumbNavigation() {
  const pathname = usePathname();
  const breadcrumbs = getBreadcrumbs(pathname);

  if (breadcrumbs.length <= 1) return null;

  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
      {breadcrumbs.map((crumb, index) => (
        <div key={crumb.href} className="flex items-center">
          {index > 0 && <span className="mx-2">/</span>}
          {index === breadcrumbs.length - 1 ? (
            <span className="text-gray-900 dark:text-white font-medium">
              {crumb.label}
            </span>
          ) : (
            <Link
              href={crumb.href}
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              {crumb.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}

/**
 * Page Header Component with Navigation
 */
export function PageHeader({
  title,
  description,
  actions
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <BreadcrumbNavigation />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
          {title}
        </h1>
        {description && (
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}

/**
 * Quick Actions Navigation
 */
export function QuickActions() {
  const { state: userState } = useUserState();
  const pathname = usePathname();

  // Define quick actions based on current page and user state
  const getQuickActions = () => {
    if (userState === "not_authenticated") {
      return [
        { label: "Sign In", href: "/auth/signin", primary: true },
        { label: "Register", href: "/auth/register", primary: false },
      ];
    }

    if (pathname === "/dashboard") {
      return [
        { label: "Add Assignment", href: "/assignments/new", primary: true },
        { label: "Import from Canvas", href: "/settings", primary: false },
      ];
    }

    if (pathname === "/courses") {
      return [
        { label: "Add Course", href: "/courses/new", primary: true },
        { label: "Import Courses", href: "/settings", primary: false },
      ];
    }

    return [];
  };

  const actions = getQuickActions();

  if (actions.length === 0) return null;

  return (
    <div className="flex gap-2">
      {actions.map(action => (
        <Link key={action.href} href={action.href}>
          <button
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              action.primary
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            }`}
          >
            {action.label}
          </button>
        </Link>
      ))}
    </div>
  );
}

/**
 * Navigation Context Provider
 */
import { createContext, useContext, useMemo } from "react";

interface NavigationContextType {
  currentPage: NavigationItem | null;
  breadcrumbs: Array<{ label: string; href: string }>;
  pageTitle: string;
  pageDescription: string;
}

const NavigationContext = createContext<NavigationContextType | null>(null);

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { state: userState } = useUserState();

  const contextValue = useMemo(() => {
    const visibleSections = getVisibleNavigationItems(userState, navigationConfig);
    let currentPage: NavigationItem | null = null;

    for (const section of visibleSections) {
      currentPage = section.items.find(item => item.href === pathname) || null;
      if (currentPage) break;
    }

    return {
      currentPage,
      breadcrumbs: getBreadcrumbs(pathname),
      pageTitle: currentPage?.label || "DueNorth",
      pageDescription: currentPage?.description || "Assignment Tracker",
    };
  }, [pathname, userState]);

  return (
    <NavigationContext.Provider value={contextValue}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error("useNavigation must be used within a NavigationProvider");
  }
  return context;
}
