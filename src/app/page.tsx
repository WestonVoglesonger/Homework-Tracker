"use client";
import Link from "next/link";

export default function IndexPage() {
  return (
    <main className="min-h-screen grid place-items-center bg-white dark:bg-gray-950">
      <div className="text-center space-y-8">
        <div className="flex items-center justify-center gap-3">
          <img src="/DueNorth-logo.png" alt="DueNorth logo" className="w-12 h-12" />
        </div>
        <h1 className="text-6xl font-extrabold tracking-tight">Welcome to DueNorth</h1>
        <div className="flex items-center justify-center gap-4">
          <Link href="/auth/signin" className="px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700">Sign in</Link>
          <Link href="/auth/register" className="px-6 py-3 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/40">Register</Link>
        </div>
      </div>
    </main>
  );
}


