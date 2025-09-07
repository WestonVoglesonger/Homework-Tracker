import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const { auth } = await import("../../../lib/auth");
  const { courseInterface } = await import("../../../interfaces/course");

  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const courses = await courseInterface.listForUser(session.user.id);
  return NextResponse.json(courses);
}

export async function POST(req: NextRequest) {
  const { auth } = await import("../../../lib/auth");
  const { createCourseSchema } = await import("../../../lib/validators");
  const { courseInterface } = await import("../../../interfaces/course");

  const session = await auth();
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


