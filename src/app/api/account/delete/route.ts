import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function DELETE() {
  const { auth } = await import("@/lib/auth");
  const { prisma } = await import("@/db/client");

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await prisma.user.delete({ where: { id: session.user.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Account delete error:", error);
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
  }
}


