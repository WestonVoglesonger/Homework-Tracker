import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const { getServerSession } = await import("next-auth");
  const { getAuth } = await import("../../../lib/auth");
  const { authOptions } = await getAuth();
  const { courseService } = await import("../../../services/courseService");

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const courses = await courseService.list(session.user.id);
  return NextResponse.json(
    courses.map((c) => ({
      id: c.id,
      name: c.name,
      code: c.code ?? undefined,
      term: c.term ?? undefined,
      color: c.color ?? undefined,
      source: (c.source as "manual" | "canvas") ?? "manual",
      canvasId: c.canvasId ?? undefined,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    }))
  );
}

export async function POST(req: NextRequest) {
  const { getServerSession } = await import("next-auth");
  const { getAuth } = await import("../../../lib/auth");
  const { authOptions } = await getAuth();
  const { createCourseSchema } = await import("../../../lib/validators");
  const { courseService } = await import("../../../services/courseService");

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await req.json();
  const parsed = createCourseSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }

  const created = await courseService.create(session.user.id, {
    ...parsed.data,
    source: json?.source === "canvas" ? "canvas" : "manual",
    canvasId: json?.canvasId ?? undefined,
  });

  return NextResponse.json({
    id: created.id,
    name: created.name,
    code: created.code ?? undefined,
    term: created.term ?? undefined,
    color: created.color ?? undefined,
    source: (created.source as "manual" | "canvas") ?? "manual",
    canvasId: created.canvasId ?? undefined,
    createdAt: created.createdAt.toISOString(),
    updatedAt: created.updatedAt.toISOString(),
  });
}


