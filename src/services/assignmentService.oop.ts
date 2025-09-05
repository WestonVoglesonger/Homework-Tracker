import { PrismaClient } from "@prisma/client";
import { getServiceContainer } from "./container/ServiceContainer";
import prisma from "../db/client";

/**
 * OOP-based assignment service implementation
 * This file provides the new OOP interface while maintaining backward compatibility
 */

// Get the service container with default database
const serviceContainer = getServiceContainer(prisma);
const assignmentService = serviceContainer.getAssignmentService();

/**
 * Backward compatibility layer - maps old functional API to new OOP services
 * This allows gradual migration of the codebase
 */

export async function list(userId: string, filters: any = {}) {
  // Convert old filter format to new format
  const newFilters = {
    status: filters.status,
    from: filters.from ? new Date(filters.from) : undefined,
    to: filters.to ? new Date(filters.to) : undefined,
  };

  return await assignmentService.listAssignments(userId, newFilters);
}

export async function create(userId: string, input: any) {
  // Convert old input format to new DTO format
  const createDTO = {
    courseId: input.courseId,
    title: input.title,
    description: input.description,
    type: input.type,
    dueAt: input.dueAt ? new Date(input.dueAt) : undefined,
    estimatedHours: input.estimatedHours,
    priority: input.priority,
    notes: input.notes,
    source: input.source,
    canvasId: input.canvasId,
    canvasUrl: input.canvasUrl,
  };

  return await assignmentService.createAssignment(userId, createDTO);
}

export async function update(userId: string, id: string, patch: any) {
  // Convert old patch format to new DTO format
  const updateDTO = {
    courseId: patch.courseId,
    title: patch.title,
    description: patch.description,
    type: patch.type,
    dueAt: patch.dueAt ? new Date(patch.dueAt) : undefined,
    estimatedHours: patch.estimatedHours,
    status: patch.status,
    priority: patch.priority,
    notes: patch.notes,
  };

  return await assignmentService.updateAssignment(userId, id, updateDTO);
}

export async function remove(userId: string, id: string) {
  const result = await assignmentService.deleteAssignment(userId, id);
  return { ok: true } as const;
}

export async function getById(userId: string, id: string) {
  return await assignmentService.getAssignment(userId, id);
}

export async function getByUserCanvasId(userId: string, canvasId: string) {
  return await assignmentService.getAssignmentByCanvasId(userId, canvasId);
}

export async function purgeAllForUser(userId: string) {
  const result = await assignmentService.purgeUserAssignments(userId);
  return { deleted: result.deleted } as const;
}

// Export the original functional interface for backward compatibility
export const assignmentServiceCompat = {
  list,
  create,
  update,
  remove,
  getById,
  getByUserCanvasId,
  purgeAllForUser,
};

// Export new OOP services for forward compatibility
export const assignmentServiceOOP = assignmentService;
export const assignmentServiceFactory = serviceContainer.getAssignmentServiceFactory();
export { serviceContainer };

// Export specialized services
export const manualAssignmentService = serviceContainer.getManualAssignmentService();
export const canvasAssignmentService = serviceContainer.getCanvasAssignmentService();
export const bulkAssignmentService = serviceContainer.getAssignmentServiceFactory().getBulkService();
export const analyticsAssignmentService = serviceContainer.getAssignmentServiceFactory().getAnalyticsService();
