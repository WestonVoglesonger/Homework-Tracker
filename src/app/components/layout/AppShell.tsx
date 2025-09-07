"use client";
import Link from "next/link";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { Button } from "../ui/button";
import { Logo } from "../ui/Logo";
import { Spinner } from "@components/ui/spinner";
import { useAdmin } from "@/app/hooks/useAdmin";
import { setupGlobalErrorHandler } from "@/lib/errorLogger";
import { CanvasSetupGate } from "@/app/components/canvas/CanvasSetupGate";
import { usePathname, useRouter } from "next/navigation";

export function AppShell({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const { isAdmin } = useAdmin();
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
    return (
      <div className="min-h-screen grid place-items-center">
        <Spinner size={48} className="text-gray-500" />
      </div>
    );
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
              {status === "authenticated" && (
                <>
                  {!isWaitlisted ? (
                    <>
                      <Link href="/dashboard" className="block px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => setMobileNavOpen(false)}>Dashboard</Link>
                      <Link href="/courses" className="block px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => setMobileNavOpen(false)}>Courses</Link>
                      <Link href="/calendar" className="block px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => setMobileNavOpen(false)}>Calendar</Link>
                      <Link href="/settings" className="block px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => setMobileNavOpen(false)}>Settings</Link>
                      {isAdmin && (
                        <Link href="/admin" className="block px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => setMobileNavOpen(false)}>Admin Panel</Link>
                      )}
                    </>
                  ) : (
                    <>
                      <Link href="/settings" className="block px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => setMobileNavOpen(false)}>Settings</Link>
                    </>
                  )}
                </>
              )}
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                {status === "authenticated" ? (
                  <button
                    className="w-full px-3 py-2 rounded-md border text-left"
                    onClick={async () => {
                      setMobileNavOpen(false);
                      await signOut({ redirect: false });
                      router.push("/");
                      router.refresh();
                    }}
                  >
                    Sign out
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <Link href="/auth/signin" className="flex-1">
                      <button className="w-full px-3 py-2 rounded-md border">Sign in</button>
                    </Link>
                    <Link href="/auth/register" className="flex-1">
                      <button className="w-full px-3 py-2 rounded-md border">Register</button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        <aside className="hidden md:flex bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-6 flex-col">
          <div className="flex items-center justify-between">
            <Logo size="lg" />
          </div>
          <nav className="flex flex-col gap-2 mt-6">
            {status === "authenticated" && (
              !isWaitlisted ? (
                <>
                  <Link 
                    href="/dashboard" 
                    className="group flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 transition-all hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-900/20 dark:hover:text-blue-300"
                  >
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    Dashboard
                  </Link>
                  <Link 
                    href="/courses" 
                    className="group flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 transition-all hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-900/20 dark:hover:text-blue-300"
                  >
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    Courses
                  </Link>
                  <Link 
                    href="/calendar" 
                    className="group flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 transition-all hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-900/20 dark:hover:text-blue-300"
                  >
                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                    Calendar
                  </Link>
                  <Link 
                    href="/settings#data" 
                    className="group flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 transition-all hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-900/20 dark:hover:text-blue-300"
                  >
                    <div className="w-2 h-2 rounded-full bg-orange-500" />
                    Settings
                  </Link>
                  {isAdmin && (
                    <Link 
                      href="/admin" 
                      className="group flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 transition-all hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-900/20 dark:hover:text-blue-300"
                    >
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      Admin Panel
                    </Link>
                  )}
                </>
              ) : (
                <>
                  <Link 
                    href="/settings#data" 
                    className="group flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 transition-all hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-900/20 dark:hover:text-blue-300"
                  >
                    <div className="w-2 h-2 rounded-full bg-orange-500" />
                    Settings
                  </Link>
                </>
              )
            )}
          </nav>
          
          {/* Account/CTA section positioned above footer */}
          {isAuthed ? (
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Signed in as</div>
                  <div className="text-sm font-medium truncate text-gray-900 dark:text-white" title={session.user?.email || undefined}>
                    {session.user?.email}
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={async () => { await signOut({ redirect: false }); router.push("/"); router.refresh(); }}
                  className="w-full"
                >
                  Sign out
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="space-y-3">
                <div className="text-sm font-medium text-gray-900 dark:text-white">Welcome to DueNorth</div>
                <div className="space-y-2">
                  <Link href="/auth/signin" className="block">
                    <Button size="sm" className="w-full">Sign in</Button>
                  </Link>
                  <Link href="/auth/register" className="block">
                    <Button size="sm" variant="outline" className="w-full">Create account</Button>
                  </Link>
                </div>
              </div>
            </div>
          )}

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


