import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { updateCourseSchema } from "../../../../lib/validators";
import { courseService } from "../../../../services/courseService";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const json = await req.json();
  const parsed = updateCourseSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  const updated = await courseService.update(session.user.id, params.id, parsed.data);
  return NextResponse.json({
    id: updated.id,
    name: updated.name,
    code: updated.code ?? undefined,
    term: updated.term ?? undefined,
    color: updated.color ?? undefined,
    source: (updated.source as "manual" | "canvas") ?? "manual",
    canvasId: updated.canvasId ?? undefined,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await courseService.remove(session.user.id, params.id);
  return NextResponse.json({ ok: true });
}


