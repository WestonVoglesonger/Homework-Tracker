import { Spinner } from "./spinner";
import { Skeleton } from "./skeleton";
import { Card, CardContent, CardHeader } from "./card";

interface LoadingSpinnerProps {
  size?: number;
  className?: string;
  text?: string;
  fullScreen?: boolean;
}

/**
 * Centralized Loading Spinner Component
 *
 * Consistent loading spinner with optional text and full-screen mode
 */
export function LoadingSpinner({
  size = 32,
  className = "text-gray-500",
  text,
  fullScreen = false
}: LoadingSpinnerProps) {
  const spinner = <Spinner size={size} className={className} />;

  if (fullScreen) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="flex flex-col items-center gap-3">
          {spinner}
          {text && <p className="text-sm text-gray-600 dark:text-gray-400">{text}</p>}
        </div>
      </div>
    );
  }

  if (text) {
    return (
      <div className="flex items-center justify-center gap-3 py-8">
        {spinner}
        <span className="text-sm text-gray-600 dark:text-gray-400">{text}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-8">
      {spinner}
    </div>
  );
}

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading: boolean;
  children: React.ReactNode;
  loadingText?: string;
  size?: number;
}

/**
 * Loading Button Component
 *
 * Button that shows loading spinner and optional loading text
 */
export function LoadingButton({
  loading,
  children,
  loadingText,
  size = 16,
  className = "",
  disabled,
  ...props
}: LoadingButtonProps) {
  return (
    <button
      className={`inline-flex items-center gap-2 ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Spinner size={size} />}
      {loading ? (loadingText || "Loading...") : children}
    </button>
  );
}

interface SkeletonGridProps {
  rows?: number;
  height?: string;
  className?: string;
}

/**
 * Skeleton Grid Component
 *
 * Consistent skeleton loading for grid layouts
 */
export function SkeletonGrid({ rows = 3, height = "h-32", className = "" }: SkeletonGridProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className={height} />
      ))}
    </div>
  );
}

interface SkeletonCardProps {
  showHeader?: boolean;
  showFooter?: boolean;
  className?: string;
}

/**
 * Skeleton Card Component
 *
 * Consistent skeleton loading for card layouts
 */
export function SkeletonCard({ showHeader = true, showFooter = false, className = "" }: SkeletonCardProps) {
  return (
    <Card className={className}>
      {showHeader && (
        <CardHeader className="pb-4">
          <Skeleton className="h-6 w-3/4" />
        </CardHeader>
      )}
      <CardContent className="pt-0">
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
          {showFooter && (
            <>
              <Skeleton className="h-px w-full my-4" />
              <Skeleton className="h-8 w-24" />
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface LoadingOverlayProps {
  loading: boolean;
  children: React.ReactNode;
  text?: string;
  className?: string;
}

/**
 * Loading Overlay Component
 *
 * Overlay that shows loading state over existing content
 */
export function LoadingOverlay({ loading, children, text, className = "" }: LoadingOverlayProps) {
  return (
    <div className={`relative ${className}`}>
      {children}
      {loading && (
        <div className="absolute inset-0 bg-white/70 dark:bg-black/50 backdrop-blur-sm grid place-items-center z-10 rounded-lg">
          <div className="flex flex-col items-center gap-3">
            <Spinner size={20} className="text-gray-600" />
            {text && <p className="text-xs text-gray-600 dark:text-gray-400">{text}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
