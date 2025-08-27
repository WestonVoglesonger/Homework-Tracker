"use client";
import { useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { CourseDTO } from "../interfaces/course";
import { AssignmentDTO } from "../interfaces/assignment";

async function getJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export function useCanvasImport() {
  const startOAuth = () => {
    window.location.href = "/api/canvas/oauth/start";
  };

  const listCanvasCourses = () => getJSON<CourseDTO[]>("/api/canvas/courses");
  const listCanvasAssignments = (courseId: string) => getJSON<AssignmentDTO[]>(`/api/canvas/assignments?courseId=${courseId}`);

  const importCourseWithAssignments = useMutation({
    mutationFn: async (course: Partial<CourseDTO>) => {
      // First, create the course
      const courseRes = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: course.name, 
          code: course.code, 
          term: course.term, 
          color: course.color, 
          source: "canvas", 
          canvasId: course.canvasId 
        }),
      });
      
      if (!courseRes.ok) throw new Error("Failed to create course");
      const createdCourse: CourseDTO = await courseRes.json();
      
      // Then, fetch and import all assignments for this course
      const assignments = await listCanvasAssignments(course.canvasId!);
      const createdAssignments: AssignmentDTO[] = [];
      
      for (const a of assignments) {
        const res = await fetch("/api/assignments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            courseId: createdCourse.id, // Use the local database course ID, not Canvas ID
            title: a.title,
            type: a.type || "OTHER",
            dueAt: a.dueAt,
            estimatedHours: a.estimatedHours,
            priority: a.priority || 0,
            notes: a.notes,
            source: "canvas",
            canvasId: a.canvasId,
          }),
        });
        if (res.ok) createdAssignments.push(await res.json());
      }
      
      return { course: createdCourse, assignments: createdAssignments };
    },
  });

  // Keep the old one for backward compatibility but discourage its use
  const importSelected = useMutation({
    mutationFn: async (items: { courses: Partial<CourseDTO>[]; assignments: Partial<AssignmentDTO>[] }) => {
      const created: { courses: CourseDTO[]; assignments: AssignmentDTO[] } = { courses: [], assignments: [] };
      
      // Create a map of Canvas course IDs to local course IDs
      const canvasToLocalCourseMap = new Map<string, string>();
      
      for (const c of items.courses) {
        const res = await fetch("/api/courses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: c.name, code: c.code, term: c.term, color: c.color, source: "canvas", canvasId: c.canvasId }),
        });
        if (res.ok) {
          const createdCourse = await res.json();
          created.courses.push(createdCourse);
          if (c.canvasId) {
            canvasToLocalCourseMap.set(c.canvasId, createdCourse.id);
          }
        }
      }
      
      for (const a of items.assignments) {
        // Map the Canvas course ID to local course ID
        const localCourseId = a.courseId && canvasToLocalCourseMap.get(a.courseId);
        if (!localCourseId) continue; // Skip if we can't find the course
        
        const res = await fetch("/api/assignments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            courseId: localCourseId, // Use the mapped local course ID
            title: a.title,
            type: a.type,
            dueAt: a.dueAt,
            estimatedHours: a.estimatedHours,
            priority: a.priority,
            notes: a.notes,
            source: "canvas",
            canvasId: a.canvasId,
          }),
        });
        if (res.ok) created.assignments.push(await res.json());
      }
      return created;
    },
  });

  return { startOAuth, listCanvasCourses, listCanvasAssignments, importSelected, importCourseWithAssignments };
}

// Optional: call this on any page to prefetch Canvas courses if connected
export function useEnsureCanvasCoursesPrefetched() {
  useEffect(() => {
    fetch("/api/canvas/courses").catch(() => {});
  }, []);
}


