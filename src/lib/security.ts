import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import DOMPurify from "isomorphic-dompurify";

// Initialize rate limiter
function getLimiter() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
  
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "10 s"),
  });
}

export async function rateLimit(key: string): Promise<boolean> {
  const limiter = getLimiter();
  if (!limiter) return true; // Allow if rate limiting is not configured
  
  const { success } = await limiter.limit(key);
  return success;
}

// Admin-specific rate limiting (stricter)
export async function adminRateLimit(key: string): Promise<boolean> {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return true;
  }
  
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
  
  const adminLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "60 s"), // 5 requests per minute
  });
  
  const { success } = await adminLimiter.limit(`admin:${key}`);
  return success;
}

// Input sanitization functions
export function sanitizeHtml(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ["b", "i", "em", "strong", "p", "br", "ul", "ol", "li"],
    ALLOWED_ATTR: [],
  });
}

export function sanitizeString(input: string): string {
  // Remove potentially dangerous characters
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .trim();
}

export function sanitizeObject(obj: any): any {
  if (typeof obj === "string") {
    return sanitizeString(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  
  if (obj && typeof obj === "object") {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[sanitizeString(key)] = sanitizeObject(value);
    }
    return sanitized;
  }
  
  return obj;
}

// CSRF protection helpers
export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    // Fallback for environments without crypto.getRandomValues
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(array, byte => byte.toString(16).padStart(2, "0")).join("");
}

export function validateCSRFToken(token: string, sessionToken: string): boolean {
  // Simple CSRF validation - in production, use a more robust implementation
  return token === sessionToken && token.length === 64;
}

// Origin validation
export function isValidOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");

  // In development, be more permissive
  if (process.env.NODE_ENV !== "production") {
    // Allow if no origin (server-side requests) or localhost origins
    if (!origin) return true;
    if (origin.includes("localhost") || origin.includes("127.0.0.1")) return true;
  }

  if (!origin || !host) return false;

  const allowedOrigins = [
    `https://${host}`,
    `http://${host}`,
    process.env.NEXTAUTH_URL,
  ].filter(Boolean);

  // In development, also allow localhost origins with any port
  if (process.env.NODE_ENV !== "production") {
    allowedOrigins.push(
      ...["http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://127.0.0.1:3000", "http://127.0.0.1:3001", "http://127.0.0.1:3002"]
    );
  }

  const isValid = allowedOrigins.some(allowed => origin === allowed);

  return isValid;
}

// SQL injection prevention helpers
export function sanitizeSQLParam(param: string): string {
  // Basic SQL injection prevention
  return param
    .replace(/'/g, "''")
    .replace(/;/g, "")
    .replace(/--/g, "")
    .replace(/\/\*/g, "")
    .replace(/\*\//g, "");
}

// Password strength validation
export function isStrongPassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }
  
  if (!/\d/.test(password)) {
    errors.push("Password must contain at least one number");
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Content Security Policy headers
export function getCSPHeaders(): Record<string, string> {
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");

  return {
    "Content-Security-Policy": csp,
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  };
}