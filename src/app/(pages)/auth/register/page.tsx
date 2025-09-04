"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Spinner } from "@components/ui/spinner";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  // Validate email for .edu restriction
  const validateEmail = (emailValue: string) => {
    if (emailValue.toLowerCase().includes('.edu')) {
      setEmailError("Personal email addresses only, .edu emails are not allowed.");
      return false;
    } else {
      setEmailError(null);
      return true;
    }
  };

  // Handle email input change
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    if (newEmail) {
      validateEmail(newEmail);
    } else {
      setEmailError(null);
    }
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Validate email before submission
    if (!validateEmail(email)) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });
      const bodyText = await res.text();
      let data: any = null;
      try {
        data = bodyText ? JSON.parse(bodyText) : null;
      } catch {
        if (!res.ok) throw new Error(bodyText?.slice(0, 200) || "Failed to register");
      }
      if (!res.ok) throw new Error(data?.error || "Failed to register");
      // Redirect to verification sent page
      router.push("/auth/verify/sent");
    } catch (err: any) {
      setError(err.message || "Failed to register");
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
          <h1 className="text-xl font-semibold">Create your account</h1>
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
          <button type="submit" disabled={loading || !!emailError} className="w-full px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-70">
            {loading ? (<span className="inline-flex items-center gap-2"><Spinner size={16} /> Creating…</span>) : "Create account"}
          </button>
        </form>
      </div>
    </div>
  );
}


