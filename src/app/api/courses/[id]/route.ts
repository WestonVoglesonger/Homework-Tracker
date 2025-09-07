import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { auth } = await import("../../../../lib/auth");
  const { updateCourseSchema } = await import("../../../../lib/validators");
  const { courseInterface } = await import("../../../../interfaces/course");

  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const json = await req.json();
  const parsed = updateCourseSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  const updated = await courseInterface.update(session.user.id, params.id, parsed.data);
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { auth } = await import("../../../../lib/auth");
  const { courseInterface } = await import("../../../../interfaces/course");

  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await courseInterface.delete(session.user.id, params.id);
  return NextResponse.json({ ok: true });
}


