import { z } from "zod";

export const assignmentStatusEnum = z.enum(["TODO", "IN_PROGRESS", "DONE"]);
export const assignmentTypeEnum = z.enum(["HOMEWORK", "QUIZ", "EXAM", "PROJECT", "OTHER"]);

export const createCourseSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().optional(),
  term: z.string().optional(),
  color: z.string().optional(),
});

export const updateCourseSchema = createCourseSchema.partial();

export const createAssignmentSchema = z.object({
  courseId: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  type: assignmentTypeEnum.default("OTHER").optional(),
  dueAt: z.string().optional(),
  estimatedHours: z.number().positive().optional(),
  priority: z.number().int().min(0).max(2).default(0).optional(),
  notes: z.string().optional(),
});

export const updateAssignmentSchema = createAssignmentSchema
  .extend({ status: assignmentStatusEnum.optional() })
  .partial();

export const listAssignmentsQuerySchema = z.object({
  status: assignmentStatusEnum.optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;
export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;
export type UpdateAssignmentInput = z.infer<typeof updateAssignmentSchema>;


