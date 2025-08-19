"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await signIn("credentials", { email, password, redirect: true, callbackUrl: "/dashboard" });
    if (res?.error) setError(res.error);
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={onSubmit} className="max-w-md w-full space-y-4 p-6 rounded-xl border bg-white">
        <h1 className="text-xl font-semibold">Sign in</h1>
        {error && <div className="text-sm text-red-600">{error}</div>}
        <div className="space-y-1">
          <label className="text-sm">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border rounded p-2" required />
        </div>
        <div className="space-y-1">
          <label className="text-sm">Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border rounded p-2" required />
        </div>
        <button type="submit" disabled={loading} className="w-full px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-70">
          {loading ? "Signing in..." : "Sign in"}
        </button>
        <div className="text-sm text-center">
          No account? <Link href={"/auth/register" as any} className="text-blue-600">Register</Link>
        </div>
      </form>
    </div>
  );
}


