import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function DELETE() {
  const { getServerSession } = await import("next-auth");
  const { getAuth } = await import("@/lib/auth");
  const { authOptions } = await getAuth();
  const { prisma } = await import("@/db/client");

  const session = await getServerSession(authOptions);
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


