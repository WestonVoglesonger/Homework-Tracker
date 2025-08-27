import { canvasService, canvasTokenService } from "@/services/canvasService";
import { courseService } from "@/services/courseService";
import { assignmentService } from "@/services/assignmentService";
import prisma from "@/db/client";

export async function syncUser(userId: string) {
  const accessToken = await canvasTokenService.getAccessTokenForUser(userId);
  if (!accessToken) return { ok: false, reason: "Not connected" } as const;
  const results = { courses: 0, assignments: 0, updated: 0 };

  const canvasCourses = await canvasService.listCanvasCourses(accessToken);
  for (const c of canvasCourses) {
    const localCourse = await prisma.course.findUnique({ where: { userId_canvasId: { userId, canvasId: c.canvasId! } } });
    if (!localCourse) continue;
    await prisma.course.update({ where: { id: localCourse.id }, data: { name: c.name, code: c.code, term: c.term } });
    results.courses++;
    const cas = await canvasService.listCanvasAssignments(accessToken, c.canvasId!);
    for (const ca of cas) {
      const existing = await prisma.assignment.findUnique({ where: { userId_canvasId: { userId, canvasId: ca.canvasId! } } });
      try {
        const sub = await canvasService.getSubmissionForSelf(accessToken, c.canvasId!, ca.canvasId!);
        const wf = sub?.workflow_state;
        const mapped = wf === "graded" ? "GRADED" : wf === "submitted" || wf === "pending_review" ? "SUBMITTED" : undefined;
        if (existing && mapped && existing.status !== mapped) {
          await prisma.assignment.update({ where: { id: existing.id }, data: { status: mapped } });
          results.updated++;
        }
      } catch {}
      if (existing) {
        await prisma.assignment.update({ where: { id: existing.id }, data: { title: ca.title, description: ca.description, dueAt: ca.dueAt ? new Date(ca.dueAt) : null, canvasUrl: ca.canvasUrl } });
      } else {
        await assignmentService.create(userId, { courseId: localCourse.id, title: ca.title, description: ca.description, type: ca.type as any, dueAt: ca.dueAt, source: "canvas", canvasId: ca.canvasId, canvasUrl: ca.canvasUrl });
      }
      results.assignments++;
    }
  }
  return { ok: true, results } as const;
}


