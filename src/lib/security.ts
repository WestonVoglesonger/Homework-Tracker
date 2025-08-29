import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let ratelimiter: Ratelimit | null = null;
function getLimiter() {
  if (!ratelimiter && process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    const redis = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN });
    ratelimiter = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, "60 s") });
  }
  return ratelimiter;
}

export async function rateLimit(key: string): Promise<boolean> {
  const limiter = getLimiter();
  if (!limiter) return true; // no-op if not configured
  const res = await limiter.limit(key);
  return res.success;
}

export function isValidOrigin(req: Request): boolean {
  const origin = (req.headers as any).get?.("origin") as string | null;
  const base = process.env.NEXTAUTH_URL || "http://localhost:3000";
  if (!origin) return true; // allow same-origin fetch without Origin header
  try {
    const ob = new URL(origin);
    const bb = new URL(base);
    // Allow exact host match to configured NEXTAUTH_URL
    if (ob.host === bb.host) return true;

    // Also allow matches to the incoming Host / X-Forwarded-Host header (handles preview/prod domains)
    const host = ((req.headers as any).get?.("x-forwarded-host") as string | null) || ((req.headers as any).get?.("host") as string | null);
    if (host && ob.host === host) return true;

    // Allow common local loopback variants when ports match
    const isLoopback: (h: string) => boolean = (h) => ["localhost", "127.0.0.1", "0.0.0.0"].includes(h);
    if (ob.port === bb.port && isLoopback(ob.hostname) && isLoopback(bb.hostname)) return true;

    return false;
  } catch {
    return false;
  }
}


