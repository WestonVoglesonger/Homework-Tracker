import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const { getServerSession } = await import("next-auth");
  const { getAuth } = await import("@/lib/auth");
  const { authOptions } = await getAuth();

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const email = session.user.email ?? null;
  const name = session.user.name ?? null;

  const { courseInterface } = await import("@/interfaces/course");
  const { assignmentInterface } = await import("@/interfaces/assignment");
  const { userInterface } = await import("@/interfaces/user");

  const [courses, assignments, preferences, prisma] = await Promise.all([
    courseInterface.listForUser(userId),
    assignmentInterface.listForUser(userId, {}),
    userInterface.getPreferences(userId).catch(() => ({ canvasSetupDismissed: false })),
    import("@/db/client").then(m => m.prisma),
  ]);
  let acceptance: { termsAcceptedAt: string | null; privacyAcceptedAt: string | null } = {
    termsAcceptedAt: null,
    privacyAcceptedAt: null,
  };
  try {
    const rows = await prisma.$queryRaw<{ termsacceptedat: Date | null; privacyacceptedat: Date | null }[]>
      `SELECT "termsAcceptedAt", "privacyAcceptedAt" FROM "User" WHERE id = ${userId} LIMIT 1`;
    const row = Array.isArray(rows) && rows[0] ? rows[0] : null;
    if (row) {
      // Some drivers may lowercase column names; handle both
      const rowObj: Record<string, unknown> = row as unknown as Record<string, unknown>;
      const tVal = (rowObj["termsAcceptedAt"] ?? rowObj["termsacceptedat"]) as unknown;
      const pVal = (rowObj["privacyAcceptedAt"] ?? rowObj["privacyacceptedat"]) as unknown;
      const t = tVal instanceof Date ? tVal : typeof tVal === "string" ? new Date(tVal) : null;
      const p = pVal instanceof Date ? pVal : typeof pVal === "string" ? new Date(pVal) : null;
      acceptance = {
        termsAcceptedAt: t ? t.toISOString() : null,
        privacyAcceptedAt: p ? p.toISOString() : null,
      };
    }
  } catch {
    // Column may not exist yet; ignore and use nulls
  }

  const payload = {
    meta: {
      generatedAt: new Date().toISOString(),
      version: 1,
      acceptance,
    },
    user: {
      id: userId,
      email,
      name,
      preferences,
    },
    courses,
    assignments,
  } as const;

  const body = JSON.stringify(payload, null, 2);
  const filename = `duenorth-data-export-${new Date().toISOString().split("T")[0]}.json`;

  return new NextResponse(body, {
    status: 200,
    headers: new Headers({
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename=\"${filename}\"`,
      "Cache-Control": "no-store",
    }),
  });
}


