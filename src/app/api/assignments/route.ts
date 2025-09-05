import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { getServerSession } = await import("next-auth");
  const { getAuth } = await import("../../../lib/auth");
  const { authOptions } = await getAuth();
  const { listAssignmentsQuerySchema } = await import("../../../lib/validators");
  const { assignmentInterface } = await import("../../../interfaces/assignment");

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);

  // Check if we're looking for a specific assignment by canvasId
  const canvasId = searchParams.get("canvasId");
  if (canvasId) {
    // We need to add a method to assignmentInterface for this
    const assignments = await assignmentInterface.listForUser(session.user.id, {});
    const assignment = assignments.find(a => a.canvasId === canvasId);
    if (assignment) {
      return NextResponse.json([assignment]);
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
  const items = await assignmentInterface.listForUser(session.user.id, parsed.data);
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const { getServerSession } = await import("next-auth");
  const { getAuth } = await import("../../../lib/auth");
  const { authOptions } = await getAuth();
  const { createAssignmentSchema } = await import("../../../lib/validators");
  const { assignmentInterface } = await import("../../../interfaces/assignment");

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

  const created = await assignmentInterface.create(session.user.id, {
    ...parsed.data,
    source: (json as any)?.source === "canvas" ? "canvas" : "manual",
    canvasId: (json as any)?.canvasId ?? undefined,
    description: (json as any)?.description ?? undefined,
    canvasUrl: (json as any)?.canvasUrl ?? undefined,
  });

  return NextResponse.json(created);
}


