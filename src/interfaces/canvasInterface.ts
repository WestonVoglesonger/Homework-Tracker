import { canvasService, canvasTokenService } from "@/services/canvasService";
import { courseInterface } from "@/interfaces/course";
import { assignmentInterface, AssignmentType } from "@/interfaces/assignment";
import { accountService } from "@/services/accountService";
import { adminService } from "@/services/adminService";

export async function syncUser(userId: string) {
  const accessToken = await canvasTokenService.getAccessTokenForUser(userId);
  if (!accessToken) return { ok: false, reason: "Not connected" } as const;
  const results = { courses: 0, assignments: 0, updated: 0 };

  const canvasCourses = await canvasService.listCanvasCourses(accessToken);
  for (const c of canvasCourses) {
    const localCourse = await courseInterface.findByUserCanvasId(userId, c.canvasId!);
    if (!localCourse) continue;
    await courseInterface.update(userId, localCourse.id, { name: c.name, code: c.code, term: c.term });
    results.courses++;
    const cas = await canvasService.listCanvasAssignments(accessToken, c.canvasId!);
    for (const ca of cas) {
      const existing = await assignmentInterface.findByUserCanvasId(userId, ca.canvasId!);

      // Always fetch latest submission status and persist it
      try {
        const sub = await canvasService.getSubmissionForSelf(accessToken, c.canvasId!, ca.canvasId!);
        const wf = sub?.workflow_state;
        const mapped = wf === "graded" ? "GRADED" : wf === "submitted" || wf === "pending_review" ? "SUBMITTED" : "NOT_SUBMITTED";
        if (existing) {
          if (existing.status !== mapped) {
            await assignmentInterface.update(userId, existing.id, { status: mapped });
            results.updated++;
          }
        } else {
          await assignmentInterface.create(userId, {
            courseId: localCourse.id,
            title: ca.title,
            description: ca.description,
            type: ca.type as AssignmentType,
            dueAt: ca.dueAt,
            source: "canvas",
            canvasId: ca.canvasId,
            canvasUrl: ca.canvasUrl,
          });
        }
      } catch {
        // If fetching submission fails, still upsert the assignment without changing status
        if (!existing) {
          await assignmentInterface.create(userId, {
            courseId: localCourse.id,
            title: ca.title,
            description: ca.description,
            type: ca.type as AssignmentType,
            dueAt: ca.dueAt,
            source: "canvas",
            canvasId: ca.canvasId,
            canvasUrl: ca.canvasUrl,
          });
        }
      }
      if (existing) {
        await assignmentInterface.update(userId, existing.id, { dueAt: ca.dueAt ?? undefined });
      }
      results.assignments++;
    }
  }
  // Persist per-user last sync timestamp
  try { await adminService.setSystemSetting(`last_canvas_sync_${userId}`, new Date().toISOString(), userId); } catch {}
  return { ok: true, results } as const;
}

export const canvasInterface = {
  async getAccessTokenForUser(userId: string): Promise<string | null> {
    return canvasTokenService.getAccessTokenForUser(userId);
  },

  async listCanvasCourses(userId: string) {
    const accessToken = await canvasTokenService.getAccessTokenForUser(userId);
    if (!accessToken) return [];
    try {
      return await canvasService.listCanvasCourses(accessToken);
    } catch (error) {
      console.warn("Canvas API error, returning empty array:", error);
      return [];
    }
  },

  async listCanvasAssignments(userId: string, courseId: string) {
    const accessToken = await canvasTokenService.getAccessTokenForUser(userId);
    if (!accessToken) return [];
    try {
      return await canvasService.listCanvasAssignments(accessToken, courseId);
    } catch (error) {
      console.warn("Canvas API error, returning empty array:", error);
      return [];
    }
  },

  async getSubmissionForSelf(userId: string, courseId: string, assignmentId: string) {
    const accessToken = await canvasTokenService.getAccessTokenForUser(userId);
    if (!accessToken) return null;
    try {
      return await canvasService.getSubmissionForSelf(accessToken, courseId, assignmentId);
    } catch (error) {
      console.warn("Canvas API error, returning null:", error);
      return null;
    }
  },

  async upsertCanvasAccount(userId: string, tokenJson: { access_token: string; refresh_token?: string; expires_in?: number; token_type?: string; scope?: string }) {
    return canvasTokenService.upsertCanvasAccount(userId, tokenJson);
  },

  async deleteCanvasAccount(userId: string) {
    return canvasTokenService.deleteCanvasAccount(userId);
  },
};

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
            const localCourse = await courseInterface.findByUserCanvasId(account.userId, canvasCourse.canvasId!);
            if (!localCourse) continue;
            await courseInterface.update(account.userId, localCourse.id, { name: canvasCourse.name, code: canvasCourse.code, term: canvasCourse.term });
            results.courses++;
            const canvasAssignments = await canvasService.listCanvasAssignments(account.access_token, canvasCourse.canvasId!);
            for (const canvasAssignment of canvasAssignments) {
              try {
                const existing = await assignmentInterface.findByUserCanvasId(account.userId, canvasAssignment.canvasId!);
                // Status is already included via include=submission; only update if it changed
                const newStatus = canvasAssignment.status as any;
                if (existing && newStatus && existing.status !== newStatus) {
                  await assignmentInterface.update(account.userId, existing.id, { status: newStatus });
                }
                if (existing) {
                  await assignmentInterface.update(account.userId, existing.id, {
                    title: canvasAssignment.title,
                    description: canvasAssignment.description,
                    dueAt: canvasAssignment.dueAt ?? undefined,
                    canvasUrl: canvasAssignment.canvasUrl
                  });
                } else {
                  await assignmentInterface.create(account.userId, {
                    courseId: localCourse.id,
                    title: canvasAssignment.title,
                    description: canvasAssignment.description,
                    type: canvasAssignment.type as AssignmentType,
                    dueAt: canvasAssignment.dueAt,
                    source: "canvas",
                    canvasId: canvasAssignment.canvasId,
                    canvasUrl: canvasAssignment.canvasUrl
                  });
                }
                results.assignments++;
              } catch (err: unknown) {
                const error = err instanceof Error ? err : new Error(String(err));
                results.errors.push(`Assignment ${canvasAssignment.title}: ${error.message}`);
              }
            }
          } catch (err: unknown) {
            const error = err instanceof Error ? err : new Error(String(err));
            results.errors.push(`Course ${canvasCourse.name}: ${error.message}`);
          }
        }
        // Update this user's last sync timestamp after successful loop
        try { await adminService.setSystemSetting(`last_canvas_sync_${account.userId}`, new Date().toISOString(), account.userId); } catch {}
      } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error(String(err));
        results.errors.push(`User ${account.userId}: ${error.message}`);
      }
    }
    return results;
  },
};


