"use client";
import Link from "next/link";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { Logo } from "../ui/Logo";
import { LoadingSpinner } from "../ui/LoadingState";
import { setupGlobalErrorHandler } from "@/lib/errorLogger";
import { CanvasSetupGate } from "@/app/components/canvas/CanvasSetupGate";
import { usePathname, useRouter } from "next/navigation";
import { EnhancedNavigation } from "@/app/components/navigation/EnhancedNavigation";
import { UserActions, UserStatus } from "@/app/components/navigation/UserNavigation";

export function AppShell({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Paths that require login + active Canvas token
  const isProtectedPath = useMemo(() => {
    const protectedPrefixes = [
      "/dashboard",
      "/courses",
      "/calendar",
      "/settings",
      "/admin",
      "/assignments",
    ];
    return protectedPrefixes.some((p) => pathname?.startsWith(p));
  }, [pathname]);

  const [checkingToken, setCheckingToken] = useState<boolean>(isProtectedPath && !Boolean((session?.user as { isWaitlisted?: boolean } | undefined)?.isWaitlisted));
  const isAuthed = status === "authenticated";
  const isWaitlisted = Boolean((session?.user as { isWaitlisted?: boolean } | undefined)?.isWaitlisted);

  // Ping Canvas on any page load (if connected) so calls aren't limited to Settings
  useEffect(() => {
    if (status === "authenticated" && !isWaitlisted) {
      fetch("/api/canvas/courses").catch(() => {});
    }
  }, [status, isWaitlisted]);

  // Setup global error handling
  useEffect(() => {
    setupGlobalErrorHandler();
  }, []);

  // Guard: redirect unauthenticated or waitlisted users away from protected paths (but allow Settings)
  useEffect(() => {
    if (!isProtectedPath) return;
    if (status === "loading") return;
    if (status === "unauthenticated") {
      // keep spinner until redirect completes
      setCheckingToken(true);
      router.replace("/");
      return;
    }
    // If authenticated but waitlisted, force to landing page unless on Settings
    if (status === "authenticated" && isWaitlisted) {
      setCheckingToken(false);
      if (!(pathname?.startsWith("/settings")) && pathname !== "/") router.replace("/");
      return;
    }
  }, [status, isProtectedPath, isWaitlisted, pathname, router]);

  // Guard: ensure authenticated, non-waitlisted users also have an active Canvas token
  // Instead of redirecting, allow navigation and let CanvasSetupGate handle the setup
  useEffect(() => {
    const checkToken = async () => {
      if (!isProtectedPath || status !== "authenticated" || isWaitlisted) return;
      setCheckingToken(true);
      try {
        const res = await fetch("/api/canvas/courses", { cache: "no-store" });
        // No redirect here - let CanvasSetupGate handle the setup wizard
        if (!res.ok) {
          console.log("Canvas token not found or invalid - CanvasSetupGate will show setup wizard");
        }
      } catch (error) {
        console.log("Error checking Canvas token:", error);
      } finally {
        setCheckingToken(false);
      }
    };
    checkToken();
  }, [status, isProtectedPath, isWaitlisted]);

  if (status === "loading" || checkingToken) {
    return <LoadingSpinner size={48} className="text-gray-500" fullScreen />;
  }
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="min-h-screen md:grid md:grid-cols-[280px_1fr]">
        {/* Mobile header with dropdown */}
        <div className="md:hidden sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
          <Logo size="md" />
          <button
            className="px-3 py-1.5 rounded-md text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
            onClick={() => setMobileNavOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            Menu
          </button>
        </div>
        {mobileNavOpen && (
          <>
            <div className="md:hidden fixed inset-0 z-40 bg-black/40" onClick={() => setMobileNavOpen(false)} />
            <div className="md:hidden fixed top-0 inset-x-0 z-50 bg-white dark:bg-gray-800 p-4 shadow-xl space-y-3">
              <div className="flex items-center justify-between mb-2">
                <div className="text-lg font-semibold">Menu</div>
                <button className="px-2 py-1 text-sm border rounded" onClick={() => setMobileNavOpen(false)}>Close</button>
              </div>
              <EnhancedNavigation mobile />
              <UserActions mobile />
            </div>
          </>
        )}

        <aside className="hidden md:flex bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-6 flex-col">
          <div className="flex items-center justify-between">
            <Logo size="lg" />
          </div>
          <EnhancedNavigation />
          
          {/* Account/CTA section positioned above footer with a single divider */}
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <UserStatus />
            <UserActions />
          </div>

          {/* Compact legal footer pinned to bottom */}
          <div className="mt-auto pt-3 text-[11px] text-gray-500 dark:text-gray-400">
            <div className="flex items-center justify-between">
              <div>© {new Date().getFullYear()} DueNorth</div>
              <nav className="flex items-center gap-2">
                <Link href="/privacy" className="hover:text-blue-600 dark:hover:text-blue-400">Privacy</Link>
                <span className="text-gray-300">•</span>
                <Link href="/terms" className="hover:text-blue-600 dark:hover:text-blue-400">Terms</Link>
                <span className="text-gray-300">•</span>
                <Link href="/data" className="hover:text-blue-600 dark:hover:text-blue-400">Your Data</Link>
              </nav>
            </div>
          </div>
        </aside>
        
        <main className="p-4 md:p-8 bg-gray-50 dark:bg-gray-900 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {isAuthed && !isWaitlisted && <CanvasSetupGate />}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default AppShell;


