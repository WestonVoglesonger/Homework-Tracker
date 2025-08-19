import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json();
    if (!email || !password) return NextResponse.json({ error: "Email and password required" }, { status: 400 });

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


