"use client";
import Link from "next/link";

export default function VerifySuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-4 p-6 rounded-xl border bg-white text-center">
        <h1 className="text-xl font-semibold">Email verified</h1>
        <p className="text-sm text-gray-700">Your email has been verified. You can now sign in.</p>
        <div className="pt-2">
          <Link href={"/auth/signin" as any} className="text-blue-600">Go to sign in</Link>
        </div>
      </div>
    </div>
  );
}


