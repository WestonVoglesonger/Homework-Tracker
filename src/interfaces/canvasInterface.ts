import { canvasService, canvasTokenService } from "@/services/canvasService";
import { courseService } from "@/services/courseService";
import { assignmentService } from "@/services/assignmentService";
import { accountService } from "@/services/accountService";

export async function syncUser(userId: string) {
  const accessToken = await canvasTokenService.getAccessTokenForUser(userId);
  if (!accessToken) return { ok: false, reason: "Not connected" } as const;
  const results = { courses: 0, assignments: 0, updated: 0 };

  const canvasCourses = await canvasService.listCanvasCourses(accessToken);
  for (const c of canvasCourses) {
    const localCourse = await courseService.findByUserCanvasId(userId, c.canvasId!);
    if (!localCourse) continue;
    await courseService.update(userId, localCourse.id, { name: c.name, code: c.code, term: c.term });
    results.courses++;
    const cas = await canvasService.listCanvasAssignments(accessToken, c.canvasId!);
    for (const ca of cas) {
      const existing = await assignmentService.getByUserCanvasId(userId, ca.canvasId!);
      // Always fetch latest submission status and persist it
      try {
        const sub = await canvasService.getSubmissionForSelf(accessToken, c.canvasId!, ca.canvasId!);
        const wf = sub?.workflow_state;
        const mapped = wf === "graded" ? "GRADED" : wf === "submitted" || wf === "pending_review" ? "SUBMITTED" : "NOT_SUBMITTED";
        if (existing) {
          if (existing.status !== mapped) {
            await assignmentService.update(userId, existing.id, { status: mapped } as any);
            results.updated++;
          }
        } else {
          await assignmentService.create(userId, {
            courseId: localCourse.id,
            title: ca.title,
            description: ca.description,
            type: ca.type as any,
            dueAt: ca.dueAt,
            status: mapped,
            source: "canvas",
            canvasId: ca.canvasId,
            canvasUrl: ca.canvasUrl,
          });
        }
      } catch {
        // If fetching submission fails, still upsert the assignment without changing status
        if (!existing) {
          await assignmentService.create(userId, {
            courseId: localCourse.id,
            title: ca.title,
            description: ca.description,
            type: ca.type as any,
            dueAt: ca.dueAt,
            source: "canvas",
            canvasId: ca.canvasId,
            canvasUrl: ca.canvasUrl,
          });
        }
      }
      if (existing) {
        await assignmentService.update(userId, existing.id, { dueAt: ca.dueAt ?? undefined } as any);
      }
      results.assignments++;
    }
  }
  return { ok: true, results } as const;
}

export const canvasAdminInterface = {
  async syncAllUsers(): Promise<{ users: number; courses: number; assignments: number; errors: string[] }> {
    const accounts = await accountService.listCanvasAccounts();
    const results = { users: 0, courses: 0, assignments: 0, errors: [] as string[] };
    for (const account of accounts) {
      if (!account.access_token) continue;
      try {
        results.users++;
        const canvasCourses = await canvasService.listCanvasCourses(account.access_token);
        for (const canvasCourse of canvasCourses) {
          try {
            const localCourse = await courseService.findByUserCanvasId(account.userId, canvasCourse.canvasId!);
            if (!localCourse) continue;
            const { default: prisma } = await import("@/db/client");
            await prisma.course.update({ where: { id: localCourse.id }, data: { name: canvasCourse.name, code: canvasCourse.code, term: canvasCourse.term } });
            results.courses++;
            const canvasAssignments = await canvasService.listCanvasAssignments(account.access_token, canvasCourse.canvasId!);
            for (const canvasAssignment of canvasAssignments) {
              try {
                const { default: prisma } = await import("@/db/client");
                const existing = await prisma.assignment.findUnique({ where: { userId_canvasId: { userId: account.userId, canvasId: canvasAssignment.canvasId! } } });
                try {
                  const submission = await canvasService.getSubmissionForSelf(account.access_token, canvasCourse.canvasId!, canvasAssignment.canvasId!);
                  const wf = submission?.workflow_state;
                  const newStatus = wf === "graded" ? "GRADED" : wf === "submitted" || wf === "pending_review" ? "SUBMITTED" : undefined;
                  if (existing && newStatus && existing.status !== newStatus) {
                    await prisma.assignment.update({ where: { id: existing.id }, data: { status: newStatus } });
                  }
                } catch {}
                if (existing) {
                  await prisma.assignment.update({ where: { id: existing.id }, data: { title: canvasAssignment.title, description: canvasAssignment.description, dueAt: canvasAssignment.dueAt ? new Date(canvasAssignment.dueAt) : null, canvasUrl: canvasAssignment.canvasUrl } });
                } else {
                  await assignmentService.create(account.userId, { courseId: localCourse.id, title: canvasAssignment.title, description: canvasAssignment.description, type: canvasAssignment.type as any, dueAt: canvasAssignment.dueAt, source: "canvas", canvasId: canvasAssignment.canvasId, canvasUrl: canvasAssignment.canvasUrl });
                }
                results.assignments++;
              } catch (err: any) {
                results.errors.push(`Assignment ${canvasAssignment.title}: ${err?.message || String(err)}`);
              }
            }
          } catch (err: any) {
            results.errors.push(`Course ${canvasCourse.name}: ${err?.message || String(err)}`);
          }
        }
      } catch (err: any) {
        results.errors.push(`User ${account.userId}: ${err?.message || String(err)}`);
      }
    }
    return results;
  },
};


