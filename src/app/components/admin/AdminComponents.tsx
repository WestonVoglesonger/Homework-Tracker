"use client";
import { ReactNode } from "react";
import { Card } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { DataCard } from "@/app/components/ui/DataCard";
import { SkeletonCard } from "@/app/components/ui/LoadingState";
import { CheckCircle, AlertTriangle, XCircle, AlertCircle } from "lucide-react";

/**
 * Admin Metric Card
 *
 * Displays system metrics with icons and status indicators
 */
export function AdminMetricCard({
  title,
  value,
  icon,
  trend,
  loading = false,
  status = "normal"
}: {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: {
    value: number;
    label: string;
  };
  loading?: boolean;
  status?: "normal" | "warning" | "error" | "success";
}) {

  if (loading) {
    return <SkeletonCard />;
  }

  return (
    <DataCard
      title={title}
      value={value}
      icon={icon}
      subtitle={trend ? `${trend.value > 0 ? "+" : ""}${trend.value}% ${trend.label}` : undefined}
      color={status === "error" ? "red" : status === "warning" ? "orange" : status === "success" ? "green" : "blue"}
    />
  );
}

/**
 * Admin Status Card
 *
 * Displays system health/status information
 */
export function AdminStatusCard({
  title,
  status,
  description,
  metrics,
  actions
}: {
  title: string;
  status: "healthy" | "warning" | "error" | "unknown";
  description?: string;
  metrics?: Array<{
    label: string;
    value: string;
    status: "healthy" | "warning" | "error";
  }>;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: "default" | "outline" | "destructive";
  }>;
}) {
  const statusConfig = {
    healthy: {
      icon: <CheckCircle className="h-5 w-5" />,
      badge: "Healthy",
      color: "bg-green-50 text-green-700 border-green-200"
    },
    warning: {
      icon: <AlertTriangle className="h-5 w-5" />,
      badge: "Warning",
      color: "bg-yellow-50 text-yellow-700 border-yellow-200"
    },
    error: {
      icon: <XCircle className="h-5 w-5" />,
      badge: "Error",
      color: "bg-red-50 text-red-700 border-red-200"
    },
    unknown: {
      icon: <AlertCircle className="h-5 w-5" />,
      badge: "Unknown",
      color: "bg-gray-50 text-gray-700 border-gray-200"
    }
  };

  const config = statusConfig[status];

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {title}
        </h3>
        <Badge variant="outline" className={config.color}>
          {config.icon}
          <span className="ml-1">{config.badge}</span>
        </Badge>
      </div>

      {description && (
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {description}
        </p>
      )}

      {metrics && metrics.length > 0 && (
        <div className="space-y-3 mb-4">
          {metrics.map((metric, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {metric.label}
              </span>
              <Badge
                variant="outline"
                className={
                  metric.status === "healthy"
                    ? "bg-green-50 text-green-700 border-green-200"
                    : metric.status === "warning"
                    ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                    : "bg-red-50 text-red-700 border-red-200"
                }
              >
                {metric.value}
              </Badge>
            </div>
          ))}
        </div>
      )}

      {actions && actions.length > 0 && (
        <div className="flex gap-2">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant || "outline"}
              size="sm"
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </Card>
  );
}

/**
 * Admin List Card
 *
 * Displays lists of items (users, errors, etc.) with consistent formatting
 */
export function AdminListCard<T = unknown>({
  title,
  items,
  loading = false,
  emptyMessage = "No items found",
  renderItem,
  actions
}: {
  title: string;
  items?: T[];
  loading?: boolean;
  emptyMessage?: string;
  renderItem: (item: T, index: number) => ReactNode;
  actions?: ReactNode;
}) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {title}
        </h3>
        {actions}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
          ))}
        </div>
      ) : items && items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item, index) => renderItem(item, index))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">
            {emptyMessage}
          </p>
        </div>
      )}
    </Card>
  );
}

/**
 * Admin User Card
 *
 * Displays user information in admin contexts
 */
export function AdminUserCard({
  user,
  onAction
}: {
  user: {
    id: string;
    name?: string;
    email: string;
    isAdmin: boolean;
    _count?: { courses: number };
    joinedAt?: string;
  };
  onAction?: (action: string, userId: string) => void;
}) {
  return (
    <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {user.name?.[0] || user.email?.[0] || "U"}
          </span>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {user.name || "No name"}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {user.email}
          </p>
          {user.joinedAt && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Joined {new Date(user.joinedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {user.isAdmin && (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Admin
          </Badge>
        )}
        {user._count?.courses !== undefined && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {user._count.courses} courses
          </span>
        )}
        {onAction && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAction("view", user.id)}
          >
            View
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * Admin Error Card
 *
 * Displays error information in admin contexts
 */
export function AdminErrorCard({
  error,
  onResolve
}: {
  error: {
    id: string;
    message: string;
    level: string;
    timestamp: string;
    user?: { email?: string };
    endpoint?: string;
  };
  onResolve?: (errorId: string) => void;
}) {
  return (
    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant={error.level === "ERROR" ? "destructive" : "secondary"}>
              {error.level}
            </Badge>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {new Date(error.timestamp).toLocaleString()}
            </span>
          </div>
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
            {error.message}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            User: {error.user?.email || "Unknown"} •
            Endpoint: {error.endpoint || "N/A"}
          </p>
        </div>
        {onResolve && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onResolve(error.id)}
            className="ml-4"
          >
            Resolve
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * Admin Stats Grid
 *
 * Pre-configured grid for admin dashboard metrics
 */
export function AdminStatsGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {children}
    </div>
  );
}

/**
 * Admin Dashboard Layout
 *
 * Consistent layout for admin pages
 */
export function AdminDashboardLayout({
  title,
  description,
  children,
  actions
}: {
  title: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {title}
          </h1>
          {description && (
            <p className="mt-2 text-gray-600 dark:text-gray-400">
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
      {children}
    </div>
  );
}
