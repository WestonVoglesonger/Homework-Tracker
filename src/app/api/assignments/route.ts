import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { getServerSession } = await import("next-auth");
  const { getAuth } = await import("../../../lib/auth");
  const { authOptions } = await getAuth();
  const { listAssignmentsQuerySchema } = await import("../../../lib/validators");
  const { assignmentService } = await import("../../../services/assignmentService");

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const parsed = listAssignmentsQuerySchema.safeParse({
    status: searchParams.get("status") || undefined,
    from: searchParams.get("from") || undefined,
    to: searchParams.get("to") || undefined,
  });
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  const items = await assignmentService.list(session.user.id, parsed.data);
  return NextResponse.json(
    items.map((a) => ({
      id: a.id,
      courseId: a.courseId ?? undefined,
      title: a.title,
      description: a.description ?? undefined,
      type: a.type,
      dueAt: a.dueAt ? a.dueAt.toISOString() : undefined,
      estimatedHours: a.estimatedHours ?? undefined,
      status: a.status,
      priority: a.priority,
      notes: a.notes ?? undefined,
      source: (a.source as "manual" | "canvas") ?? "manual",
      canvasId: a.canvasId ?? undefined,
      canvasUrl: a.canvasUrl ?? undefined,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
    }))
  );
}

export async function POST(req: NextRequest) {
  const { getServerSession } = await import("next-auth");
  const { getAuth } = await import("../../../lib/auth");
  const { authOptions } = await getAuth();
  const { createAssignmentSchema } = await import("../../../lib/validators");
  const { assignmentService } = await import("../../../services/assignmentService");

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const json = await req.json();
  const parsed = createAssignmentSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  const created = await assignmentService.create(session.user.id, {
    ...parsed.data,
    source: (json as any)?.source === "canvas" ? "canvas" : "manual",
    canvasId: (json as any)?.canvasId ?? undefined,
    description: (json as any)?.description ?? undefined,
    canvasUrl: (json as any)?.canvasUrl ?? undefined,
  });
  return NextResponse.json({
    id: created.id,
    courseId: created.courseId ?? undefined,
    title: created.title,
    description: created.description ?? undefined,
    type: created.type,
    dueAt: created.dueAt ? created.dueAt.toISOString() : undefined,
    estimatedHours: created.estimatedHours ?? undefined,
    status: created.status,
    priority: created.priority,
    notes: created.notes ?? undefined,
    source: (created.source as "manual" | "canvas") ?? "manual",
    canvasId: created.canvasId ?? undefined,
    canvasUrl: created.canvasUrl ?? undefined,
    createdAt: created.createdAt.toISOString(),
    updatedAt: created.updatedAt.toISOString(),
  });
}


