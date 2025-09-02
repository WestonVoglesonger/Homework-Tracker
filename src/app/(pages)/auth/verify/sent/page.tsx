"use client";
import Link from "next/link";

export default function VerifySentPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-4 p-6 rounded-xl border bg-white text-center">
        <h1 className="text-xl font-semibold">Check your email</h1>
        <p className="text-sm text-gray-700">
          If an account exists for the provided email, we sent a link to verify your address.
        </p>
        <div className="pt-2">
          <Link href={"/auth/signin" as any} className="text-blue-600">Back to sign in</Link>
        </div>
      </div>
    </div>
  );
}


