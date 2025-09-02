"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Spinner } from "@components/ui/spinner";

export const dynamic = "force-dynamic";

function ResetPasswordContent() {
  const params = useSearchParams();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setEmail(params.get("email") || "");
    setToken(params.get("token") || "");
  }, [params]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await fetch("/api/auth/password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, newPassword: password }),
      });
      setDone(true);
      setTimeout(() => router.push("/auth/signin"), 1200);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={onSubmit} className="max-w-md w-full space-y-4 p-6 rounded-xl border bg-white">
        <h1 className="text-xl font-semibold">Reset password</h1>
        {error && <div className="text-sm text-red-600">{error}</div>}
        {done ? (
          <div className="text-sm text-gray-700">If valid, your password was updated. Redirecting…</div>
        ) : (
          <>
            <div className="space-y-1">
              <label className="text-sm">New password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border rounded p-2" required />
            </div>
            <div className="space-y-1">
              <label className="text-sm">Confirm password</label>
              <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="w-full border rounded p-2" required />
            </div>
            <button type="submit" disabled={loading} className="w-full px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-70">
              {loading ? (<span className="inline-flex items-center gap-2"><Spinner size={16} /> Updating…</span>) : "Update password"}
            </button>
          </>
        )}
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center p-6">Loading…</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}


