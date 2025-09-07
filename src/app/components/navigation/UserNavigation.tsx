import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUserStateUI } from "@/app/hooks/useUserState";
import { Button } from "@/app/components/ui/button";
import { signOut } from "next-auth/react";

/**
 * Centralized User Navigation Component
 *
 * Handles navigation items based on user state with consistent styling
 */
export function UserNavigation({ mobile = false }: { mobile?: boolean }) {
  const { navigationItems } = useUserStateUI();

  const getIconElement = (iconName: string) => {
    const iconClasses = mobile ? "w-5 h-5" : "w-2 h-2";

    switch (iconName) {
      case "dashboard":
        return <div className={`${iconClasses} rounded-full bg-blue-500`} />;
      case "courses":
        return <div className={`${iconClasses} rounded-full bg-green-500`} />;
      case "calendar":
        return <div className={`${iconClasses} rounded-full bg-purple-500`} />;
      case "settings":
        return <div className={`${iconClasses} rounded-full bg-orange-500`} />;
      case "admin":
        return <div className={`${iconClasses} rounded-full bg-red-500`} />;
      default:
        return <div className={`${iconClasses} rounded-full bg-gray-400`} />;
    }
  };

  if (mobile) {
    return (
      <nav className="flex flex-col gap-2">
        {navigationItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 transition-all hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-900/20 dark:hover:text-blue-300"
          >
            {getIconElement(item.icon)}
            {item.label}
          </Link>
        ))}
      </nav>
    );
  }

  return (
    <nav className="flex flex-col gap-2 mt-6">
      {navigationItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="group flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 transition-all hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-900/20 dark:hover:text-blue-300"
        >
          {getIconElement(item.icon)}
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

/**
 * User Actions Component
 *
 * Handles sign in/out and account actions based on user state
 */
export function UserActions({ mobile = false }: { mobile?: boolean }) {
  const { availableActions, userMessage } = useUserStateUI();
  const isProd = process.env.NODE_ENV === "production";
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push("/");
    router.refresh();
  };

  if (mobile) {
    return (
      <div className="space-y-3">
        {userMessage && !isProd && (
          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700">
            <div className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">
              {userMessage.title}
            </div>
            <div className="text-sm text-blue-700 dark:text-blue-300">
              {userMessage.message}
            </div>
          </div>
        )}

        <div className="pt-2">
          {availableActions.includes("signin") && (
            <div className="flex gap-2">
              <Link href="/auth/signin" className="flex-1">
                <button className="w-full px-3 py-2 rounded-md border">Sign in</button>
              </Link>
              <Link href="/auth/register" className="flex-1">
                <button className="w-full px-3 py-2 rounded-md border">Register</button>
              </Link>
            </div>
          )}

          {availableActions.includes("delete_account") && (
            <Button
              variant="destructive"
              size="sm"
              onClick={async () => {
                if (!confirm("Delete your account and all data? This cannot be undone.")) return;
                const res = await fetch("/api/account/delete", { method: "DELETE" });
                if (res.ok) {
                  await signOut({ redirect: false });
                  router.push("/");
                }
              }}
              className="w-full mt-2"
            >
              Delete account
            </Button>
          )}

          {(availableActions.includes("all_features") || availableActions.includes("settings")) && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="w-full mt-2"
            >
              Sign out
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 pt-4">
      {/* Status card displayed by UserStatus above; avoid duplicating here on desktop */}
      <div className="space-y-3">
        {(availableActions.includes("all_features") || availableActions.includes("settings")) && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            className="w-full"
          >
            Sign out
          </Button>
        )}

        {availableActions.includes("signin") && (
          <div className="space-y-2">
            <Link href="/auth/signin" className="block">
              <Button size="sm" className="w-full">Sign in</Button>
            </Link>
            <Link href="/auth/register" className="block">
              <Button size="sm" variant="outline" className="w-full">Create account</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * User Status Display Component
 *
 * Shows current user information and status
 */
export function UserStatus() {
  const { userMessage } = useUserStateUI();
  const isProd = process.env.NODE_ENV === "production";

  if (!userMessage || isProd) return null;

  return (
    <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700">
      <div className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">
        {userMessage.title}
      </div>
      <div className="text-sm text-blue-700 dark:text-blue-300">
        {userMessage.message}
      </div>
    </div>
  );
}
