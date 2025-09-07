"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Spinner } from "@components/ui/spinner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@components/ui/dialog";

type RegisterResponse = {
  id: string;
  email: string;
  name?: string;
  waitlisted?: boolean;
  error?: string;
};

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [limitReached, setLimitReached] = useState(false);
  const [checkingLimit, setCheckingLimit] = useState(true);

  // Check user limit on component mount
  useEffect(() => {
    const checkUserLimit = async () => {
      try {
        const res = await fetch("/api/user-limit", { cache: "no-store" });
        const data = await res.json();
        setLimitReached(Boolean(data.limitReached));
      } catch (error) {
        console.error("Failed to check user limit:", error);
        // Default to allowing registration if check fails
        setLimitReached(false);
      } finally {
        setCheckingLimit(false);
      }
    };

    checkUserLimit();
  }, []);

  // Email validation is currently disabled

  // Handle email input change
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    setEmailError(null); // Clear any previous errors
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Email validation is disabled
    if (!accepted) {
      setError("You must accept the Terms of Service and Privacy Policy.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, termsAccepted: true, privacyAccepted: true }),
      });
      const bodyText = await res.text();
      let data: RegisterResponse | null = null;
      try {
        data = bodyText ? JSON.parse(bodyText) : null;
      } catch {
        if (!res.ok) throw new Error(bodyText?.slice(0, 200) || "Failed to register");
      }
      if (!res.ok) throw new Error(data?.error || "Failed to register");

      // Check if user was added to waitlist
      if (data?.waitlisted) {
        // Redirect to waitlist confirmation page
        router.push("/auth/waitlist/confirmation");
      } else {
        // Normal registration flow
        router.push("/auth/verify/sent");
      }
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error("Failed to register");
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  // Show loading state while checking limit
  if (checkingLimit) {
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
            <div className="space-y-4 p-6 rounded-xl border bg-white">
              <div className="text-center">
                <Spinner size={32} />
                <p className="mt-4 text-gray-600">Checking availability...</p>
              </div>
            </div>
          </div>
        </div>
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
            <div className="text-center">
              <h1 className="text-xl font-semibold">
                {limitReached ? "Join the Waitlist" : "Create your account"}
              </h1>
              {limitReached && (
                <p className="text-sm text-gray-600 mt-2">
                  We&apos;ve reached our current user limit. Join our waitlist and we&apos;ll notify you when space becomes available.
                </p>
              )}
            </div>
            {error && <div className="text-sm text-red-600">{error}</div>}
            <div className="space-y-1">
              <label className="text-sm">Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="w-full border rounded p-2" />
            </div>
            <div className="space-y-1">
              <label className="text-sm">Email</label>
              <input
                type="email"
                value={email}
                onChange={handleEmailChange}
                className={`w-full border rounded p-2 ${emailError ? 'border-red-500' : ''}`}
                required
              />
              {emailError && <div className="text-sm text-red-600">{emailError}</div>}
            </div>
            <div className="space-y-1">
              <label className="text-sm">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border rounded p-2" required />
              <div className="text-xs text-gray-600 mt-1">
                Password must be at least 8 characters and include uppercase, lowercase, and number.
              </div>
            </div>
            <div className="space-y-2">
              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={accepted}
                  onChange={(e) => setAccepted(e.target.checked)}
                  className="mt-0.5"
                  required
                />
                <span>
                  I agree to the{' '}
                  <Dialog>
                    <DialogTrigger asChild>
                      <button type="button" className="text-blue-600 hover:underline">Terms of Service</button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Terms of Service</DialogTitle>
                        <DialogDescription>
                          Please review the terms that govern your use of DueNorth.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="prose max-h-[60vh] overflow-y-auto text-sm">
                        <p>By creating an account and using DueNorth, you agree not to misuse the service, acknowledge that content is provided as-is, and understand that we may update these terms from time to time. If terms change materially, we may request re-acceptance.</p>
                        <p>See the full policy at <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">/terms</a>.</p>
                      </div>
                    </DialogContent>
                  </Dialog>
                  {' '}and acknowledge the Privacy{' '}
                  <Dialog>
                    <DialogTrigger asChild>
                      <button type="button" className="text-blue-600 hover:underline">Privacy Policy</button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Privacy Policy</DialogTitle>
                        <DialogDescription>
                          Learn how DueNorth collects, uses, and protects your data.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="prose max-h-[60vh] overflow-y-auto text-sm">
                        <p>We collect only what’s necessary to operate DueNorth (like account info and coursework metadata), retain it for limited periods, and never sell your data. You can export or delete your data anytime from Settings.</p>
                        <p>See the full policy at <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">/privacy</a>.</p>
                      </div>
                    </DialogContent>
                  </Dialog>
                  .
                </span>
              </label>
            </div>

            <button type="submit" disabled={loading || !!emailError || !accepted} className="w-full px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-70">
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <Spinner size={16} />
                  {limitReached ? "Joining waitlist…" : "Creating…"}
                </span>
              ) : (
                limitReached ? "Join Waitlist" : "Create account"
              )}
            </button>
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


