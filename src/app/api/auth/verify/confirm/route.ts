import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({ email: z.string().email(), token: z.string().min(10) });

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const email = url.searchParams.get("email");
  const token = url.searchParams.get("token");
  const parsed = schema.safeParse({ email, token });
  if (!parsed.success) return NextResponse.redirect(new URL("/auth/verify/sent", url.origin));

  const { verificationInterface } = await import("../../../../../interfaces/verification");
  const ok = await verificationInterface.confirmVerification(parsed.data.email, parsed.data.token);

  // Redirect to a success page regardless of outcome to avoid information leakage
  const dest = ok ? "/auth/verify/success" : "/auth/verify/sent";
  return NextResponse.redirect(new URL(dest, url.origin));
}
