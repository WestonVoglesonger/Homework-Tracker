import { assignmentService } from "@/services/assignmentService";
import { courseService } from "@/services/courseService";

export const adminInterface = {
  async purgeUserData(userId: string): Promise<{ assignmentsDeleted: number; coursesDeleted: number }> {
    const a = await assignmentService.purgeAllForUser(userId);
    const c = await courseService.purgeAllForUser(userId);
    return { assignmentsDeleted: a.deleted, coursesDeleted: c.deleted };
  },
};


