import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { LoadingOverlay } from "./LoadingState";

interface DataCardProps {
  title: string;
  value?: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: {
    value: number;
    label: string;
    positive?: boolean;
  };
  loading?: boolean;
  href?: string;
  onClick?: () => void;
  className?: string;
  color?: "blue" | "green" | "purple" | "orange" | "red" | "gray";
}

/**
 * Centralized Data Card Component
 *
 * Consistent card design for displaying data with optional trend indicators
 */
export function DataCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  loading = false,
  href,
  onClick,
  className = "",
  color = "gray",
}: DataCardProps) {
  const colorClasses = {
    blue: "border-l-4 border-l-blue-500",
    green: "border-l-4 border-l-green-500",
    purple: "border-l-4 border-l-purple-500",
    orange: "border-l-4 border-l-orange-500",
    red: "border-l-4 border-l-red-500",
    gray: "border-l-4 border-l-gray-400",
  };

  const dotBgClasses = {
    blue: "bg-blue-500",
    green: "bg-green-500",
    purple: "bg-purple-500",
    orange: "bg-orange-500",
    red: "bg-red-500",
    gray: "bg-gray-400",
  } as const;

  const cardProps = href ? { href } : { onClick };

  return (
    <LoadingOverlay loading={loading} className="h-full">
      <Card
        className={`group relative overflow-hidden card-hover bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 ${colorClasses[color]} hover:shadow-lg transition-all duration-300 rounded-xl min-h-[160px] ${className} ${
          href || onClick ? "cursor-pointer" : ""
        }`}
        {...(cardProps as React.HTMLAttributes<HTMLDivElement>)}
      >
        {/* Subtle gradient overlay */}
        <div className={`absolute inset-0 bg-gradient-to-br ${
          color === "blue" ? "from-blue-500 to-blue-600" :
          color === "green" ? "from-green-500 to-green-600" :
          color === "purple" ? "from-purple-500 to-purple-600" :
          color === "orange" ? "from-orange-500 to-orange-600" :
          color === "red" ? "from-red-500 to-red-600" :
          "from-gray-500 to-gray-600"
        } opacity-5 group-hover:opacity-10 transition-opacity duration-200 pointer-events-none`} />

        {/* Top accent border */}
        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${
          color === "blue" ? "from-blue-500 to-blue-600" :
          color === "green" ? "from-green-500 to-green-600" :
          color === "purple" ? "from-purple-500 to-purple-600" :
          color === "orange" ? "from-orange-500 to-orange-600" :
          color === "red" ? "from-red-500 to-red-600" :
          "from-gray-500 to-gray-600"
        } opacity-20 group-hover:opacity-100 transition-opacity duration-200`} />

        <CardHeader className="relative flex-row items-center justify-between pb-4">
          <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-3">
            {icon ? (
              <div className="flex-shrink-0 text-gray-500 dark:text-gray-400">{icon}</div>
            ) : (
              <span className={`inline-block w-2.5 h-2.5 rounded-full ${dotBgClasses[color]}`} />
            )}
            <span>{title}</span>
          </CardTitle>
        </CardHeader>

        <CardContent className="relative pt-0">
          <div className="text-5xl font-bold text-gray-900 dark:text-white mb-3">
            {value ?? "..."}
          </div>

          {subtitle && (
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              {subtitle}
            </div>
          )}

          {trend && (
            <div className={`flex items-center gap-1 text-xs font-medium ${
              trend.positive !== false ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
            }`}>
              <svg
                className={`w-3 h-3 ${trend.positive !== false ? "" : "rotate-180"}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              <span>{trend.value > 0 ? "+" : ""}{trend.value}% {trend.label}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </LoadingOverlay>
  );
}

/**
 * Action Card Component
 *
 * Card designed for displaying actionable content with hover effects
 */
export function ActionCard({
  title,
  description,
  icon,
  action,
  loading = false,
  href,
  onClick,
  className = "",
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  loading?: boolean;
  href?: string;
  onClick?: () => void;
  className?: string;
}) {
  const cardProps = href ? { href } : { onClick };

  return (
    <LoadingOverlay loading={loading}>
      <Card
        className={`group relative overflow-hidden card-hover bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300 ${className} ${
          href || onClick ? "cursor-pointer" : ""
        }`}
        {...(cardProps as React.HTMLAttributes<HTMLDivElement>)}
      >
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-500 opacity-5 group-hover:opacity-10 transition-opacity duration-200" />

        {/* Top accent border */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

        <CardContent className="relative p-6">
          <div className="flex items-start gap-4">
            {icon && (
              <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700">
                {icon}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                {title}
              </h3>

              {description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {description}
                </p>
              )}

              {action && (
                <div className="flex items-center justify-between">
                  {action}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </LoadingOverlay>
  );
}

/**
 * Stat Cards Grid Component
 *
 * Pre-configured grid layout for displaying multiple data cards
 */
export function StatCardsGrid({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 md:gap-8 ${className}`}>
      {children}
    </div>
  );
}

/**
 * Info Card Component
 *
 * Simple card for displaying information with consistent styling
 */
export function InfoCard({
  children,
  className = "",
  icon,
  variant = "default"
}: {
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
  variant?: "default" | "accent" | "warning" | "success" | "error";
}) {
  const variants = {
    default: "bg-gray-50 dark:bg-gray-800",
    accent: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700",
    warning: "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700",
    success: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700",
    error: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700",
  };

  return (
    <div className={`flex items-start gap-3 p-4 rounded-lg border ${variants[variant]} ${className}`}>
      {icon && <div className="flex-shrink-0 mt-0.5">{icon}</div>}
      <div className="flex-1">{children}</div>
    </div>
  );
}

/**
 * Interactive Card Component
 *
 * Clickable card with hover effects for interactive content
 */
export function InteractiveCard({
  children,
  onClick,
  href,
  className = "",
  disabled = false
}: {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  className?: string;
  disabled?: boolean;
}) {
  const baseClasses = `
    group/item text-xs p-2 rounded-lg bg-gray-50 dark:bg-gray-700
    border border-gray-200 dark:border-gray-600
    hover:border-gray-300 dark:hover:border-gray-500
    transition-all duration-200 cursor-pointer hover:shadow-sm
    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
    ${className}
  `;

  if (href) {
    return (
      <a href={href} className={baseClasses}>
        {children}
      </a>
    );
  }

  return (
    <div onClick={disabled ? undefined : onClick} className={baseClasses}>
      {children}
    </div>
  );
}

/**
 * Form Card Component
 *
 * Card specifically designed for form sections
 */
export function FormCard({
  children,
  className = "",
  title,
  description
}: {
  children: ReactNode;
  className?: string;
  title?: string;
  description?: string;
}) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm ${className}`}>
      {(title || description) && (
        <div className="mb-4">
          {title && <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>}
          {description && <p className="text-gray-600 dark:text-gray-400">{description}</p>}
        </div>
      )}
      {children}
    </div>
  );
}

/**
 * Section Card Component
 *
 * Simple card for sectioning content with consistent padding
 */
export function SectionCard({
  children,
  className = "",
  padding = "normal"
}: {
  children: ReactNode;
  className?: string;
  padding?: "compact" | "normal" | "large";
}) {
  const paddingClasses = {
    compact: "p-3",
    normal: "p-4",
    large: "p-6"
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 ${paddingClasses[padding]} ${className}`}>
      {children}
    </div>
  );
}
