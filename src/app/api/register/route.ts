import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isValidOrigin, rateLimit } from "../../../lib/security";
import { errorLogInterface } from "../../../interfaces/errorLogInterface";

const registerSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[a-z]/, "Password must include a lowercase letter")
    .regex(/[A-Z]/, "Password must include an uppercase letter")
    .regex(/[0-9]/, "Password must include a number"),
  name: z.string().max(100).optional(),
  termsAccepted: z.literal(true, { errorMap: () => ({ message: "You must accept the Terms of Service" }) }),
  privacyAccepted: z.literal(true, { errorMap: () => ({ message: "You must acknowledge the Privacy Policy" }) }),
});

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RegisterBody = {
  email: string;
  password: string;
  name?: string;
  termsAccepted: true;
  privacyAccepted: true;
};

export async function POST(req: NextRequest) {
  let body: RegisterBody | null = null;

  try {
    // Origin validation
    if (!isValidOrigin(req as unknown as Request)) return NextResponse.json({ error: "Invalid origin" }, { status: 400 });

    const ip = (req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "")
      .split(",")[0]
      .trim() || "unknown";

    // Rate limiting
    const ok = await rateLimit(`register:${ip}`);
    if (!ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

    body = (await req.json()) as RegisterBody;
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
    }
    const { email, password, name } = parsed.data;

    // Check if user limit is reached
    const { waitlistInterface } = await import("../../../interfaces/waitlist");
    const isLimitReached = await waitlistInterface.checkUserLimit();

    if (isLimitReached) {
      console.log("[register API] User limit reached, adding to waitlist...");
      const { userInterface } = await import("../../../interfaces/user");
      const now = new Date();

      // Create user but mark as waitlisted
      const user = await userInterface.register({
        email,
        password,
        name,
        termsAcceptedAt: now,
        privacyAcceptedAt: now,
      });

      // Add to waitlist
      await waitlistInterface.registerWaitlistedUser({
        userId: user.id,
        email,
        name,
      });

      // Update user to be waitlisted
      await waitlistInterface.updateUserWaitlistStatus(user.id, true);

      console.log("[register API] User added to waitlist:", user.id);

      // Send verification email after successful waitlist registration
      console.log("[register API] Sending verification email...");
      const { verificationInterface } = await import("../../../interfaces/verification");
      await verificationInterface.requestVerification(email);
      console.log("[register API] Verification email process completed");

      const response = NextResponse.json({
        id: user.id,
        email: user.email,
        name: user.name,
        waitlisted: true
      });
      // Ensure no caching for registration responses
      response.headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
      response.headers.set("Pragma", "no-cache");
      response.headers.set("Expires", "0");
      return response;
    }

    // Normal registration flow
    console.log("[register API] Creating user...");
    const { userInterface } = await import("../../../interfaces/user");
    const now = new Date();
    const user = await userInterface.register({
      email,
      password,
      name,
      termsAcceptedAt: now,
      privacyAcceptedAt: now,
    });
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
  } catch (err: unknown) {
    // Log the error for monitoring
    await errorLogInterface.createErrorLog({
      level: "ERROR",
      message: err instanceof Error ? err.message : "Unknown error",
      stack: err instanceof Error ? err.stack : undefined,
      context: {
        endpoint: req.nextUrl.pathname,
        method: req.method,
        userAgent: req.headers.get("user-agent") || undefined,
        ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || undefined,
        additionalData: {
          email: body?.email,
          registrationAttempt: true
        },
      },
    });

    // Handle specific error types
    let errorMessage = "Invalid request";
    let statusCode = 400;

    if (err && typeof err === "object" && 'code' in err && (err as { code?: string }).code === "EMAIL_EXISTS") {
      errorMessage = "An account with this email already exists";
      statusCode = 409; // Conflict
    } else if (err instanceof Error && err.message) {
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


