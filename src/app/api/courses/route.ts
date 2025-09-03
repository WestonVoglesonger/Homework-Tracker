import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const { getServerSession } = await import("next-auth");
  const { getAuth } = await import("../../../lib/auth");
  const { authOptions } = await getAuth();
  const { courseInterface } = await import("../../../interfaces/course");

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const courses = await courseInterface.listForUser(session.user.id);
  return NextResponse.json(courses);
}

export async function POST(req: NextRequest) {
  const { getServerSession } = await import("next-auth");
  const { getAuth } = await import("../../../lib/auth");
  const { authOptions } = await getAuth();
  const { createCourseSchema } = await import("../../../lib/validators");
  const { courseInterface } = await import("../../../interfaces/course");

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await req.json();
  const parsed = createCourseSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }

  const created = await courseInterface.create(session.user.id, {
    ...parsed.data,
    source: json?.source === "canvas" ? "canvas" : "manual",
    canvasId: json?.canvasId ?? undefined,
  });

  return NextResponse.json(created);
}


