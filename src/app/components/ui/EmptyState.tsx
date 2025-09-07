import { ReactNode } from "react";
import { Button } from "./button";
import Link from "next/link";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  actions?: Array<{
    label: string;
    href?: string;
    onClick?: () => void;
    variant?: "default" | "outline" | "secondary";
    external?: boolean;
  }>;
  className?: string;
}

/**
 * Centralized Empty State Component
 *
 * Consistent empty state design with optional icon, description, and actions
 */
export function EmptyState({
  title,
  description,
  icon,
  actions = [],
  className = ""
}: EmptyStateProps) {
  return (
    <div className={`text-center py-12 ${className}`}>
      {icon && (
        <div className="mx-auto mb-6 w-16 h-16 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
          {icon}
        </div>
      )}

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>

      {description && (
        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
          {description}
        </p>
      )}

      {actions.length > 0 && (
        <div className="flex gap-3 justify-center">
          {actions.map((action, index) => {
            const button = (
              <Button
                key={index}
                variant={action.variant || "outline"}
                onClick={action.onClick}
                asChild={!!action.href}
              >
                {action.href ? (
                  <Link href={action.href} {...(action.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                    {action.label}
                  </Link>
                ) : (
                  action.label
                )}
              </Button>
            );
            return button;
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Pre-configured Empty State Components
 */

export function NoAssignmentsEmptyState({ title = "No assignments yet", className, showCanvasCta = false }: { title?: string; className?: string; showCanvasCta?: boolean }) {
  return (
    <EmptyState
      title={title}
      description="Congratulations! You're on top of your assignments."
      icon={
        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      }
      actions={showCanvasCta ? [
        { label: "Import from Canvas", href: "/settings", variant: "default" },
      ] : []}
      className={className}
    />
  );
}

export function NoCoursesEmptyState({ className }: { className?: string }) {
  return (
    <EmptyState
      title="No courses yet"
      description="Add your courses manually or import them from Canvas to get started."
      icon={
        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      }
      actions={[
        { label: "Import from Canvas", href: "/settings", variant: "default" },
      ]}
      className={className}
    />
  );
}

export function NoCanvasConnectionEmptyState({ className }: { className?: string }) {
  return (
    <EmptyState
      title="No Canvas connection found"
      description="Connect your Canvas account to automatically sync your courses and assignments."
      icon={
        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      }
      actions={[
        { label: "Connect Canvas", href: "/settings", variant: "default" },
      ]}
      className={className}
    />
  );
}
