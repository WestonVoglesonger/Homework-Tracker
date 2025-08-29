"use client";
import Link from "next/link";

export default function IndexPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-950 dark:to-gray-900">
      <div className="max-w-5xl mx-auto px-6 py-16">
        <header className="flex items-center justify-between mb-12">
          <div className="text-2xl font-bold">Homework Tracker</div>
          <nav className="flex items-center gap-4">
            <Link href="/auth/signin" className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">Sign in</Link>
            <Link href="/auth/register" className="px-4 py-2 rounded-md border border-blue-600 text-blue-700 hover:bg-blue-50 dark:text-blue-300 dark:border-blue-400 dark:hover:bg-blue-900/20">Create account</Link>
          </nav>
        </header>

        <section className="text-center py-12">
          <h1 className="text-5xl font-extrabold tracking-tight mb-6">Stay on top of your coursework</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-10">
            Organize assignments, track deadlines, and sync with Canvas — all in one place.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/auth/register" className="px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700">Get started</Link>
            <Link href="/auth/signin" className="px-6 py-3 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">I already have an account</Link>
          </div>
        </section>

        <section className="grid md:grid-cols-3 gap-6 mt-16">
          <div className="p-6 rounded-xl border bg-white dark:bg-gray-900 dark:border-gray-800 text-left">
            <div className="text-xl font-semibold mb-2">Smart dashboard</div>
            <p className="text-gray-600 dark:text-gray-400">See overdue and upcoming tasks at a glance with clean visuals.</p>
          </div>
          <div className="p-6 rounded-xl border bg-white dark:bg-gray-900 dark:border-gray-800 text-left">
            <div className="text-xl font-semibold mb-2">Canvas sync</div>
            <p className="text-gray-600 dark:text-gray-400">Import courses and assignments securely with one click.</p>
          </div>
          <div className="p-6 rounded-xl border bg-white dark:bg-gray-900 dark:border-gray-800 text-left">
            <div className="text-xl font-semibold mb-2">Fast & private</div>
            <p className="text-gray-600 dark:text-gray-400">Your data stays yours. Sign in to access your dashboard.</p>
          </div>
        </section>
      </div>
    </main>
  );
}


