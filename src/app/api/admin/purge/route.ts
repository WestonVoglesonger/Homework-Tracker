import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getAuth } from "@/lib/auth";
import { getAdminService, getAssignmentService, getCourseService, getAnalyticsService } from "@/services/container/ServiceContainer";
import { default as prisma } from "@/db/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { authOptions } = await getAuth();
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Support optional target in body; default to current user
  let targetUserId: string | undefined;
  try {
    const body = await req.json().catch(() => null);
    targetUserId = body?.targetUserId as string | undefined;
  } catch {
    // ignore malformed body
  }

  const finalTargetUserId = targetUserId || session.user.id;

  // Check admin permissions
  const adminService = getAdminService(prisma);
  const isAdmin = await adminService.isAdmin(session.user.id);
  if (!isAdmin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const assignmentService = getAssignmentService(prisma);
  const courseService = getCourseService(prisma);
  const analyticsService = getAnalyticsService(prisma);

  const assignmentsResult = await assignmentService.purgeUserAssignments(finalTargetUserId);
  const coursesResult = await courseService.purgeUserCourses(finalTargetUserId);

  // Log admin action
  await adminService.logAdminAction({
    action: "user_data_purge",
    targetId: finalTargetUserId,
    targetType: "user",
    data: {
      assignmentsDeleted: assignmentsResult.deleted,
      coursesDeleted: coursesResult.deleted
    },
    adminId: session.user.id,
  });

  // Track the API call
  await analyticsService.trackUserActivity(session.user.id, "API: POST /api/admin/purge");

  return NextResponse.json({
    ok: true,
    assignmentsDeleted: assignmentsResult.deleted,
    coursesDeleted: coursesResult.deleted
  });
}


