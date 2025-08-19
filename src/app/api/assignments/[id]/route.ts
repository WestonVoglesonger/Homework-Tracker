import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { getServerSession } = await import("next-auth");
  const { getAuth } = await import("../../../../lib/auth");
  const { authOptions } = await getAuth();
  const { updateAssignmentSchema } = await import("../../../../lib/validators");
  const { assignmentService } = await import("../../../../services/assignmentService");

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const json = await req.json();
  const parsed = updateAssignmentSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  const updated = await assignmentService.update(session.user.id, params.id, parsed.data);
  return NextResponse.json({
    id: updated.id,
    courseId: updated.courseId ?? undefined,
    title: updated.title,
    description: updated.description ?? undefined,
    type: updated.type,
    dueAt: updated.dueAt ? updated.dueAt.toISOString() : undefined,
    estimatedHours: updated.estimatedHours ?? undefined,
    status: updated.status,
    priority: updated.priority,
    notes: updated.notes ?? undefined,
    source: (updated.source as "manual" | "canvas") ?? "manual",
    canvasId: updated.canvasId ?? undefined,
    canvasUrl: updated.canvasUrl ?? undefined,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { getServerSession } = await import("next-auth");
  const { getAuth } = await import("../../../../lib/auth");
  const { authOptions } = await getAuth();
  const { assignmentService } = await import("../../../../services/assignmentService");

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await assignmentService.remove(session.user.id, params.id);
  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { getServerSession } = await import("next-auth");
  const { getAuth } = await import("../../../../lib/auth");
  const { authOptions } = await getAuth();
  const { prisma } = await import("../../../../db/client");

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const assignment = await prisma.assignment.findFirst({
    where: { id: params.id, userId: session.user.id },
  });
  if (!assignment) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({
    id: assignment.id,
    courseId: assignment.courseId ?? undefined,
    title: assignment.title,
    description: assignment.description ?? undefined,
    type: assignment.type,
    dueAt: assignment.dueAt ? assignment.dueAt.toISOString() : undefined,
    estimatedHours: assignment.estimatedHours ?? undefined,
    status: assignment.status,
    priority: assignment.priority,
    notes: assignment.notes ?? undefined,
    source: (assignment.source as "manual" | "canvas") ?? "manual",
    canvasId: assignment.canvasId ?? undefined,
    canvasUrl: assignment.canvasUrl ?? undefined,
    createdAt: assignment.createdAt.toISOString(),
    updatedAt: assignment.updatedAt.toISOString(),
  });
}


