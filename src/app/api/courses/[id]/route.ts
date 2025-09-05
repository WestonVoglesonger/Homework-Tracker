import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getAuth } from "@/lib/auth";
import { updateCourseSchema } from "@/lib/validators";
import { getCourseService } from "@/services/container/ServiceContainer";
import { default as prisma } from "@/db/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { authOptions } = await getAuth();
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await req.json();
  const parsed = updateCourseSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  const courseService = getCourseService(prisma);
  const updated = await courseService.updateCourse(session.user.id, params.id, parsed.data);

  // Convert to frontend DTO format
  const dto = {
    id: updated.id,
    name: updated.name,
    code: updated.code ?? undefined,
    term: updated.term ?? undefined,
    color: updated.color ?? undefined,
    source: updated.source ?? "manual",
    canvasId: updated.canvasId ?? undefined,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  };

  return NextResponse.json(dto);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { authOptions } = await getAuth();
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const courseService = getCourseService(prisma);
  await courseService.deleteCourse(session.user.id, params.id);
  return NextResponse.json({ ok: true });
}


