"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Spinner } from "@components/ui/spinner";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/auth/password/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setDone(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <Image 
            src="/logo/due-north-logo.png" 
            alt="DueNorth Logo" 
            width={80} 
            height={80} 
            className="mx-auto w-20 h-20 mb-4"
            priority
          />
        </div>
        <form onSubmit={onSubmit} className="space-y-4 p-6 rounded-xl border bg-white">
          <h1 className="text-xl font-semibold">Forgot password</h1>
          {done ? (
            <p className="text-sm text-gray-700">If an account exists, we sent a reset link to that email.</p>
          ) : (
            <>
              <div className="space-y-1">
                <label className="text-sm">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border rounded p-2" required />
              </div>
              <button type="submit" disabled={loading} className="w-full px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-70">
                {loading ? (<span className="inline-flex items-center gap-2"><Spinner size={16} /> Sending…</span>) : "Send reset link"}
              </button>
            </>
          )}
          <div className="text-sm text-center">
            <Link href="/auth/signin" className="text-blue-600">Back to sign in</Link>
          </div>
        </form>
      </div>
    </div>
  );
}


