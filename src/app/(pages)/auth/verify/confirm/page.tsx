"use client";

import { useCallback, useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Spinner } from "@components/ui/spinner";

function VerifyConfirmContent() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") || "";
  const token = params.get("token") || "";
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const disabled = useMemo(() => !email || !token, [email, token]);

  const onConfirm = useCallback(async () => {
    if (disabled || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/verify/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token }),
      });
      const data = await res.json().catch(() => ({ ok: false }));
      if (res.ok && data?.ok) {
        router.replace("/auth/verify/success");
      } else {
        router.replace("/auth/verify/sent");
      }
    } catch (e: any) {
      setError("Verification failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }, [disabled, submitting, email, token, router]);

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
        <div className="space-y-4 p-6 rounded-xl border bg-white text-center">
          <h1 className="text-xl font-semibold">Confirm email verification</h1>
          <p className="text-sm text-gray-700">
            Click the button below to verify your email address.
          </p>
          {error && <div className="text-sm text-red-600">{error}</div>}
          <button
            onClick={onConfirm}
            disabled={disabled || submitting}
            className="w-full px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-70"
          >
            {submitting ? (
              <span className="inline-flex items-center gap-2"><Spinner size={16} /> Verifying…</span>
            ) : (
              "Verify email"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function VerifyConfirmPage() {
  return (
    <Suspense fallback={
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
          <div className="space-y-4 p-6 rounded-xl border bg-white text-center">
            <h1 className="text-xl font-semibold">Loading...</h1>
            <div className="flex justify-center">
              <Spinner size={24} />
            </div>
          </div>
        </div>
      </div>
    }>
      <VerifyConfirmContent />
    </Suspense>
  );
}


