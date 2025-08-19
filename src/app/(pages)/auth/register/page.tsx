"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to register");
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Failed to register");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={onSubmit} className="max-w-md w-full space-y-4 p-6 rounded-xl border bg-white">
        <h1 className="text-xl font-semibold">Create your account</h1>
        {error && <div className="text-sm text-red-600">{error}</div>}
        <div className="space-y-1">
          <label className="text-sm">Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full border rounded p-2" />
        </div>
        <div className="space-y-1">
          <label className="text-sm">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border rounded p-2" required />
        </div>
        <div className="space-y-1">
          <label className="text-sm">Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border rounded p-2" required />
        </div>
        <button type="submit" disabled={loading} className="w-full px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-70">
          {loading ? "Creating..." : "Create account"}
        </button>
      </form>
    </div>
  );
}


