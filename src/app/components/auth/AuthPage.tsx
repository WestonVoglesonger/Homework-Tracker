"use client";
import { ReactNode } from "react";

/**
 * Auth Page Wrapper
 *
 * Provides consistent layout and behavior for all authentication pages
 */
export function AuthPage({
  children,
  className = ""
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${className}`}>
      {children}
    </div>
  );
}

/**
 * Auth Success Page
 *
 * Shows success message after authentication actions
 */
export function AuthSuccessPage({
  title,
  message,
  actionText,
  actionHref,
  className = ""
}: {
  title: string;
  message: string;
  actionText?: string;
  actionHref?: string;
  className?: string;
}) {
  return (
    <AuthPage className={className}>
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {title}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {message}
            </p>
          </div>

          {actionText && actionHref && (
            <a
              href={actionHref}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              {actionText}
            </a>
          )}
        </div>
      </div>
    </AuthPage>
  );
}

/**
 * Auth Error Page
 *
 * Shows error message for authentication failures
 */
export function AuthErrorPage({
  title,
  message,
  actionText,
  actionHref,
  className = ""
}: {
  title: string;
  message: string;
  actionText?: string;
  actionHref?: string;
  className?: string;
}) {
  return (
    <AuthPage className={className}>
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {title}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {message}
            </p>
          </div>

          {actionText && actionHref && (
            <a
              href={actionHref}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              {actionText}
            </a>
          )}
        </div>
      </div>
    </AuthPage>
  );
}
