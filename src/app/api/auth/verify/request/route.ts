import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isValidOrigin, rateLimit } from "@/lib/security";
import { getAuthenticationService } from "@/services/container/ServiceContainer";
import { default as prisma } from "@/db/client";

const schema = z.object({ email: z.string().email() });

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    if (!isValidOrigin(req as any)) return NextResponse.json({ ok: true });
    const ip = (req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "")
      .split(",")[0]
      .trim() || "unknown";
    const ok = await rateLimit(`verify:request:${ip}`);
    if (!ok) return NextResponse.json({ ok: true });

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ ok: true });

    const authService = getAuthenticationService(prisma);
    await authService.resendVerificationEmail(parsed.data.email);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
