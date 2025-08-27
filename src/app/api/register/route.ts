import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isValidOrigin, rateLimit } from "../../../lib/security";

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
  try {
    if (!isValidOrigin(req as any)) return NextResponse.json({ error: "Invalid origin" }, { status: 400 });

    const ip = (req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "")
      .split(",")[0]
      .trim() || "unknown";
    const ok = await rateLimit(`register:${ip}`);
    if (!ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
    }
    const { email, password, name } = parsed.data;

    const { default: prisma } = await import("../../../db/client");
    const existing = await prisma.user.findUnique({ where: { email } }) as any;
    if (existing?.passwordHash) return NextResponse.json({ error: "Email already registered" }, { status: 409 });

    const { hash } = await import("bcryptjs");
    const passwordHash = await hash(password, 12);

    const user = (await prisma.user.upsert({
      where: { email },
      update: ({ passwordHash, name: name ?? undefined } as any),
      create: ({ email, passwordHash, name: name ?? undefined } as any),
    })) as any;

    return NextResponse.json({ id: user.id, email: user.email, name: user.name });
  } catch (err) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}


