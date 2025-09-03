import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isValidOrigin, rateLimit } from "../../../../../lib/security";

const schema = z.object({ email: z.string().email(), token: z.string().min(10) });

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const email = url.searchParams.get("email");
  const token = url.searchParams.get("token");
  const parsed = schema.safeParse({ email, token });
  // Never verify on GET. Redirect to the confirmation page which requires an explicit action.
  if (!parsed.success) {
    return NextResponse.redirect(new URL("/auth/verify/sent", url.origin));
  }
  const redirectUrl = new URL("/auth/verify/confirm", url.origin);
  redirectUrl.searchParams.set("email", parsed.data.email);
  redirectUrl.searchParams.set("token", parsed.data.token);
  return NextResponse.redirect(redirectUrl);
}

export async function POST(req: NextRequest) {
  try {
    // Origin + rate limit guards
    if (!isValidOrigin(req as any)) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    const ip = (req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "")
      .split(",")[0]
      .trim() || "unknown";
    const allowed = await rateLimit(`verify:confirm:${ip}`);
    if (!allowed) return NextResponse.json({ ok: false }, { status: 429 });

    const body = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const { verificationInterface } = await import("../../../../../interfaces/verification");
    const ok = await verificationInterface.confirmVerification(parsed.data.email, parsed.data.token);

    const response = NextResponse.json({ ok });
    response.headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
    return response;
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
