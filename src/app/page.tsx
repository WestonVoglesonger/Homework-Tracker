"use client";
import Link from "next/link";
import { Logo } from "./components/ui/Logo";

export default function IndexPage() {
  return (
    <main className="min-h-screen grid place-items-center bg-white dark:bg-gray-950">
      <div className="text-center space-y-12">
        <div className="flex flex-col items-center gap-8">
          <Logo size="3xl" showText={true} />
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-md leading-relaxed">
            Making homework management easier and more efficient for students.
          </p>
        </div>
        <div className="flex items-center justify-center gap-6">
          <Link href="/auth/signin" className="px-8 py-4 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium transition-colors">
            Sign in
          </Link>
          <Link href="/auth/register" className="px-8 py-4 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/40 font-medium transition-colors">
            Get started
          </Link>
        </div>
      </div>
    </main>
  );
}


