import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getAuth } from "@/lib/auth";
import { listAssignmentsQuerySchema, createAssignmentSchema } from "@/lib/validators";
import { getAssignmentService } from "@/services/container/ServiceContainer";
import { default as prisma } from "@/db/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { authOptions } = await getAuth();
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const assignmentService = getAssignmentService(prisma);

  // Check if we're looking for a specific assignment by canvasId
  const canvasId = searchParams.get("canvasId");
  if (canvasId) {
    const assignment = await assignmentService.getAssignmentByCanvasId(session.user.id, canvasId);
    if (assignment) {
      // Convert to frontend DTO format
      const dto = {
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
        source: assignment.source ?? "manual",
        canvasId: assignment.canvasId ?? undefined,
        canvasUrl: assignment.canvasUrl ?? undefined,
        createdAt: assignment.createdAt.toISOString(),
        updatedAt: assignment.updatedAt.toISOString(),
      };
      return NextResponse.json([dto]);
    } else {
      return NextResponse.json([]);
    }
  }

  // Regular list query
  const parsed = listAssignmentsQuerySchema.safeParse({
    status: searchParams.get("status") || undefined,
    from: searchParams.get("from") || undefined,
    to: searchParams.get("to") || undefined,
  });
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  const assignments = await assignmentService.listAssignments(session.user.id, {
    status: parsed.data.status,
    from: parsed.data.from ? new Date(parsed.data.from) : undefined,
    to: parsed.data.to ? new Date(parsed.data.to) : undefined,
  });

  // Convert to frontend DTO format
  const dtos = assignments.map(a => ({
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
    source: a.source ?? "manual",
    canvasId: a.canvasId ?? undefined,
    canvasUrl: a.canvasUrl ?? undefined,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  }));

  return NextResponse.json(dtos);
}

export async function POST(req: NextRequest) {
  const { authOptions } = await getAuth();
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let json;
  try {
    json = await req.json();
  } catch (error) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createAssignmentSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  const assignmentService = getAssignmentService(prisma);
  const created = await assignmentService.createAssignment(session.user.id, {
    ...parsed.data,
    dueAt: parsed.data.dueAt ? new Date(parsed.data.dueAt) : undefined,
    source: (json as any)?.source === "canvas" ? "canvas" : "manual",
    canvasId: (json as any)?.canvasId ?? undefined,
    description: (json as any)?.description ?? undefined,
    canvasUrl: (json as any)?.canvasUrl ?? undefined,
  });

  // Convert to frontend DTO format
  const dto = {
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
    source: created.source ?? "manual",
    canvasId: created.canvasId ?? undefined,
    canvasUrl: created.canvasUrl ?? undefined,
    createdAt: created.createdAt.toISOString(),
    updatedAt: created.updatedAt.toISOString(),
  };

  return NextResponse.json(dto);
}


