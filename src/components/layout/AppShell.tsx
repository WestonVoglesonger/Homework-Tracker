"use client";
import Link from "next/link";
import { ReactNode, useEffect } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { Button } from "../ui/button";

export function AppShell({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();

  // Ping Canvas on any page load (if connected) so calls aren't limited to Settings
  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/canvas/courses").catch(() => {});
    }
  }, [status]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="min-h-screen grid grid-cols-[280px_1fr]">
        <aside className="bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-6 space-y-6">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            Homework Tracker
          </div>
          <nav className="flex flex-col gap-2">
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
              href="/settings" 
              className="group flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 transition-all hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-900/20 dark:hover:text-blue-300"
            >
              <div className="w-2 h-2 rounded-full bg-orange-500" />
              Settings
            </Link>
          </nav>
          
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            {status === "authenticated" ? (
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
                  onClick={() => signOut()}
                  className="w-full"
                >
                  Sign out
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Link href={"/auth/signin" as any} className="flex-1">
                  <Button size="sm" className="w-full">Sign in</Button>
                </Link>
                <Link href={"/auth/register" as any} className="flex-1">
                  <Button size="sm" variant="outline" className="w-full">Register</Button>
                </Link>
              </div>
            )}
          </div>
        </aside>
        
        <main className="p-8 bg-gray-50 dark:bg-gray-900 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default AppShell;


