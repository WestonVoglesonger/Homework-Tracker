import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isValidOrigin, rateLimit } from "@/lib/security";
import prisma from "@/db/client";
import { compare } from "bcryptjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    if (!isValidOrigin(req as unknown as Request)) {
      return NextResponse.json({ code: "InvalidRequest" }, { status: 400 });
    }

    const ip = (req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "")
      .split(",")[0]
      .trim() || "unknown";
    const ok = await rateLimit(`diagnose:${ip}`);
    if (!ok) return NextResponse.json({ code: "TooManyRequests" }, { status: 429 });

    const json = await req.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ code: "InvalidRequest" }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase().trim();
    const password = parsed.data.password;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user?.passwordHash) {
      return NextResponse.json({ code: "UserNotFound" });
    }

    const isValid = await compare(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ code: "InvalidPassword" });
    }

    if (!user.emailVerified) {
      return NextResponse.json({ code: "EmailNotVerified" });
    }

    return NextResponse.json({ code: "Unknown" });
  } catch {
    return NextResponse.json({ code: "InvalidRequest" }, { status: 400 });
  }
}


