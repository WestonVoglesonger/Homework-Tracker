"use client";
import { ReactNode, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { LoadingButton } from "@/app/components/ui/LoadingState";
import { ErrorDisplay } from "@/app/components/ui/ErrorDisplay";
import { useErrorHandler } from "@/app/hooks/useErrorHandler";

interface AuthFormProps {
  title: string;
  description?: string;
  onSubmit: (data: Record<string, string>) => Promise<void>;
  fields: Array<{
    name: string;
    label: string;
    type: "email" | "password" | "text";
    placeholder?: string;
    required?: boolean;
    autoComplete?: string;
  }>;
  submitText: string;
  loadingText?: string;
  footerLinks?: Array<{
    text: string;
    href: string;
    linkText: string;
  }>;
  additionalContent?: ReactNode;
  className?: string;
}

/**
 * Centralized Auth Form Component
 *
 * Provides consistent form styling and behavior for all authentication pages
 */
export function AuthForm({
  title,
  description,
  onSubmit,
  fields,
  submitText,
  loadingText,
  footerLinks = [],
  additionalContent,
  className = ""
}: AuthFormProps) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { handleError } = useErrorHandler();

  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null); // Clear error on input change
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await onSubmit(formData);
    } catch (err) {
      const errorMessage = handleError(err instanceof Error ? err : new Error(String(err)), {
        operation: title.toLowerCase().replace(/\s+/g, "_")
      });
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col ${className}`}>
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full space-y-6">
          {/* Logo */}
          <div className="text-center">
            <Image
              src="/logo/due-north-logo.png"
              alt="DueNorth Logo"
              width={80}
              height={80}
              className="mx-auto w-20 h-20 mb-4"
              priority
            />
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="space-y-4 p-6 rounded-xl border bg-white dark:bg-gray-800 shadow-lg"
          >
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                {title}
              </h1>
              {description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {description}
                </p>
              )}
            </div>

            {/* Error Display */}
            {error && (
              <ErrorDisplay
                message={error}
                severity="error"
                className="text-sm"
              />
            )}

            {/* Form Fields */}
            <div className="space-y-4">
              {fields.map(field => (
                <div key={field.name} className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {field.label}
                  </label>
                  <input
                    type={field.type}
                    name={field.name}
                    value={formData[field.name] || ""}
                    onChange={(e) => handleInputChange(field.name, e.target.value)}
                    placeholder={field.placeholder}
                    autoComplete={field.autoComplete}
                    required={field.required}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500/20 transition-colors"
                  />
                </div>
              ))}
            </div>

            {/* Additional Content */}
            {additionalContent}

            {/* Submit Button */}
            <LoadingButton
              loading={loading}
              loadingText={loadingText}
              className="w-full py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitText}
            </LoadingButton>

            {/* Footer Links */}
            {footerLinks.length > 0 && (
              <div className="text-center space-y-2">
                {footerLinks.map((link, index) => (
                  <div key={index} className="text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      {link.text}{" "}
                    </span>
                    <Link
                      href={link.href}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                    >
                      {link.linkText}
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="max-w-md mx-auto">
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link
              href="/privacy"
              className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
            >
              Privacy
            </Link>
            <span className="text-gray-300 dark:text-gray-600">•</span>
            <Link
              href="/terms"
              className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
            >
              Terms
            </Link>
            <span className="text-gray-300 dark:text-gray-600">•</span>
            <Link
              href="/data"
              className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
            >
              Your Data
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

/**
 * Pre-configured Auth Form Components
 */

export function SignInForm() {
  const handleSubmit = async (data: Record<string, string>) => {
    // This will be handled by the parent component
    console.log("Sign in data:", data);
  };

  return (
    <AuthForm
      title="Sign In"
      description="Welcome back! Please sign in to your account."
      onSubmit={handleSubmit}
      fields={[
        {
          name: "email",
          label: "Email",
          type: "email",
          placeholder: "Enter your email",
          required: true,
          autoComplete: "email"
        },
        {
          name: "password",
          label: "Password",
          type: "password",
          placeholder: "Enter your password",
          required: true,
          autoComplete: "current-password"
        }
      ]}
      submitText="Sign In"
      loadingText="Signing in..."
      footerLinks={[
        {
          text: "No account?",
          href: "/auth/register",
          linkText: "Register"
        },
        {
          text: "Forgot password?",
          href: "/auth/forgot-password",
          linkText: "Reset it"
        }
      ]}
    />
  );
}

export function RegisterForm() {
  const handleSubmit = async (data: Record<string, string>) => {
    // This will be handled by the parent component
    console.log("Register data:", data);
  };

  return (
    <AuthForm
      title="Create Account"
      description="Join DueNorth to track your assignments and stay organized."
      onSubmit={handleSubmit}
      fields={[
        {
          name: "name",
          label: "Full Name",
          type: "text",
          placeholder: "Enter your full name",
          required: true,
          autoComplete: "name"
        },
        {
          name: "email",
          label: "Email",
          type: "email",
          placeholder: "Enter your email",
          required: true,
          autoComplete: "email"
        },
        {
          name: "password",
          label: "Password",
          type: "password",
          placeholder: "Create a password",
          required: true,
          autoComplete: "new-password"
        }
      ]}
      submitText="Create Account"
      loadingText="Creating account..."
      footerLinks={[
        {
          text: "Already have an account?",
          href: "/auth/signin",
          linkText: "Sign In"
        }
      ]}
      additionalContent={
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="terms"
              name="acceptedTerms"
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="terms" className="text-sm text-gray-600 dark:text-gray-400">
              I agree to the{" "}
              <Link href="/terms" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                Privacy Policy
              </Link>
            </label>
          </div>
        </div>
      }
    />
  );
}

export function ForgotPasswordForm() {
  const handleSubmit = async (data: Record<string, string>) => {
    // This will be handled by the parent component
    console.log("Forgot password data:", data);
  };

  return (
    <AuthForm
      title="Forgot Password"
      description="Enter your email and we'll send you a reset link."
      onSubmit={handleSubmit}
      fields={[
        {
          name: "email",
          label: "Email",
          type: "email",
          placeholder: "Enter your email address",
          required: true,
          autoComplete: "email"
        }
      ]}
      submitText="Send Reset Link"
      loadingText="Sending..."
      footerLinks={[
        {
          text: "Remember your password?",
          href: "/auth/signin",
          linkText: "Sign In"
        }
      ]}
    />
  );
}
