import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isValidOrigin, rateLimit } from "../../../lib/security";
import { logApiError } from "../../../services/errorLogService";

const registerSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[a-z]/, "Password must include a lowercase letter")
    .regex(/[A-Z]/, "Password must include an uppercase letter")
    .regex(/[0-9]/, "Password must include a number"),
  name: z.string().max(100).optional(),
});

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: any = null;

  try {
    // Origin validation
    if (!isValidOrigin(req as any)) return NextResponse.json({ error: "Invalid origin" }, { status: 400 });

    const ip = (req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "")
      .split(",")[0]
      .trim() || "unknown";

    // Rate limiting
    const ok = await rateLimit(`register:${ip}`);
    if (!ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

    body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
    }
    const { email, password, name } = parsed.data;

    console.log("[register API] Creating user...");
    const { userInterface } = await import("../../../interfaces/user");
    const user = await userInterface.register({ email, password, name });
    console.log("[register API] User created:", user.id);

    // Send verification email after successful registration
    console.log("[register API] Sending verification email...");
    const { verificationInterface } = await import("../../../interfaces/verification");
    await verificationInterface.requestVerification(email);
    console.log("[register API] Verification email process completed");

    const response = NextResponse.json({ id: user.id, email: user.email, name: user.name });
    // Ensure no caching for registration responses
    response.headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
    return response;
  } catch (err: any) {
    // Log the error for monitoring
    await logApiError(req, err, undefined, {
      email: body?.email,
      registrationAttempt: true
    });

    // Handle specific error types
    let errorMessage = "Invalid request";
    let statusCode = 400;

    if (err?.code === "EMAIL_EXISTS" || err?.message?.toLowerCase().includes("email already registered")) {
      errorMessage = "An account with this email already exists";
      statusCode = 409; // Conflict
    } else if (err?.message) {
      const message = err.message.toLowerCase();

      if (message.includes("password")) {
        errorMessage = err.message; // Password validation errors
      } else if (message.includes("email")) {
        errorMessage = "Invalid email format";
      }
    }

    const response = NextResponse.json({ error: errorMessage }, { status: statusCode });
    // Ensure no caching for error responses
    response.headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
    return response;
  }
}


