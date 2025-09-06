"use client";
import { useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { getSignInErrorMessage } from "@/lib/authErrors";
import Link from "next/link";
import Image from "next/image";
import { Spinner } from "@components/ui/spinner";

export default function SignInPage() {
  const { status } = useSession();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  // If already authenticated (valid session cookie), skip this page
  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [status, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await signIn("credentials", { email, password, redirect: false });
    if (res?.error) {
      setError(getSignInErrorMessage(res.error));
    } else if (res?.ok) {
      window.location.href = "/dashboard";
    }
    setLoading(false);
  }

  async function onResendVerification() {
    if (!email) return;
    setResending(true);
    try {
      await fetch("/api/auth/verify/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      // No toast framework here; remain silent per anti-enumeration.
    } finally {
      setResending(false);
    }
  }

  if (status === "authenticated") {
    return (
      <div className="min-h-screen grid place-items-center">
        <Spinner size={24} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex items-center justify-center p-6">
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
              {loading ? (<span className="inline-flex items-center gap-2"><Spinner size={16} /> Signing in…</span>) : "Sign in"}
            </button>
            <div className="text-sm text-center space-y-1">
              <div>
                No account? <Link href="/auth/register" className="text-blue-600">Register</Link>
              </div>
              <div>
                <Link href="/auth/forgot-password" className="text-blue-600">Forgot password?</Link>
              </div>
              <div>
                <button type="button" onClick={onResendVerification} disabled={resending || !email} className="text-blue-600 disabled:opacity-60">
                  {resending ? "Resending…" : "Resend verification email"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 p-4">
        <div className="max-w-md mx-auto">
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link
              href="/privacy"
              className="text-gray-600 hover:text-blue-600 transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-gray-600 hover:text-blue-600 transition-colors"
            >
              Terms of Service
            </Link>
            <Link
              href="/settings#data"
              className="text-gray-600 hover:text-blue-600 transition-colors"
            >
              Your Data
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}


