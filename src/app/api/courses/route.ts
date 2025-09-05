import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getAuth } from "@/lib/auth";
import { createCourseSchema } from "@/lib/validators";
import { getCourseService } from "@/services/container/ServiceContainer";
import { default as prisma } from "@/db/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const { authOptions } = await getAuth();
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const courseService = getCourseService(prisma);
  const courses = await courseService.listCourses(session.user.id);

  // TODO: Consider adding caching for user courses
  // Courses change less frequently than assignments and would benefit from Redis caching

  // Convert to frontend DTO format
  const dtos = courses.map(c => ({
    id: c.id,
    name: c.name,
    code: c.code ?? undefined,
    term: c.term ?? undefined,
    color: c.color ?? undefined,
    source: c.source ?? "manual",
    canvasId: c.canvasId ?? undefined,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }));

  return NextResponse.json(dtos);
}

export async function POST(req: NextRequest) {
  const { authOptions } = await getAuth();
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await req.json();
  const parsed = createCourseSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }

  const courseService = getCourseService(prisma);
  const created = await courseService.createCourse(session.user.id, {
    ...parsed.data,
    source: json?.source === "canvas" ? "canvas" : "manual",
    canvasId: json?.canvasId ?? undefined,
  });

  // Convert to frontend DTO format
  const dto = {
    id: created.id,
    name: created.name,
    code: created.code ?? undefined,
    term: created.term ?? undefined,
    color: created.color ?? undefined,
    source: created.source ?? "manual",
    canvasId: created.canvasId ?? undefined,
    createdAt: created.createdAt.toISOString(),
    updatedAt: created.updatedAt.toISOString(),
  };

  return NextResponse.json(dto);
}


