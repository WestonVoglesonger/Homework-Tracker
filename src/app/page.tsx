"use client";
import { Logo } from "./components/ui/Logo";
import AppShell from "./components/layout/AppShell";
import { useSession } from "next-auth/react";
import { Spinner } from "./components/ui/spinner";

export default function IndexPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <AppShell>
        <div className="min-h-[60vh] grid place-items-center">
          <Spinner size={32} />
        </div>
      </AppShell>
    );
  }

  const isAuthed = status === "authenticated";

  return (
    <AppShell>
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center space-y-10 max-w-4xl">
          <div className="flex flex-col items-center gap-6">
            <Logo size="3xl" showText={true} />
            <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
              DueNorth is a student-built assistant that keeps your Canvas assignments organized and on schedule.
              Connect your Canvas account, track deadlines, and stay on top of your semester with a clear, focused dashboard.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
            <div className="rounded-lg border bg-white dark:bg-gray-800 p-4">
              <div className="font-semibold mb-1">Canvas sync</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Securely connect your Canvas to pull courses and assignments.</div>
            </div>
            <div className="rounded-lg border bg-white dark:bg-gray-800 p-4">
              <div className="font-semibold mb-1">Smart overview</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">See overdue, upcoming, and progress at a glance.</div>
            </div>
            <div className="rounded-lg border bg-white dark:bg-gray-800 p-4">
              <div className="font-semibold mb-1">Privacy-first</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Your token is encrypted; delete or export your data anytime.</div>
            </div>
          </div>
          {isAuthed && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Signed in as {session?.user?.email}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}


