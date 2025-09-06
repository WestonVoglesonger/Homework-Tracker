import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isValidOrigin, rateLimit } from "../../../../../lib/security";

const schema = z.object({
  email: z.string().email(),
  token: z.string().min(10),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[a-z]/, "Password must include a lowercase letter")
    .regex(/[A-Z]/, "Password must include an uppercase letter")
    .regex(/[0-9]/, "Password must include a number"),
});

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    if (!isValidOrigin(req as unknown as Request)) return NextResponse.json({ ok: false }, { status: 400 });
    const ip = (req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "")
      .split(",")[0]
      .trim() || "unknown";
    const okLimit = await rateLimit(`password:reset:${ip}`);
    if (!okLimit) return NextResponse.json({ ok: false }, { status: 429 });

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });

    const { passwordResetInterface } = await import("../../../../../interfaces/passwordReset");
    const ok = await passwordResetInterface.resetPassword(parsed.data.email, parsed.data.token, parsed.data.newPassword);

    // 200 with boolean result; client shows generic message on failure
    const response = NextResponse.json({ ok });
    // Ensure no caching for password reset responses
    response.headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
    return response;
  } catch {
    const response = NextResponse.json({ ok: false }, { status: 400 });
    // Ensure no caching for error responses
    response.headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
    return response;
  }
}
