"use client";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useMutation } from "@tanstack/react-query";
import { CourseDTO } from "@/interfaces/course";
import { AssignmentDTO } from "@/interfaces/assignment";

async function getJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export function useCanvasImport() {
  const { status } = useSession();
  const startOAuth = () => {
    window.location.href = "/api/canvas/oauth/start";
  };

  const listCanvasCourses = () => getJSON<CourseDTO[]>("/api/canvas/courses");
  const listCanvasAssignments = (courseId: string) => getJSON<AssignmentDTO[]>(`/api/canvas/assignments?courseId=${courseId}`);

  const importCourseWithAssignments = useMutation({
    mutationFn: async (course: Partial<CourseDTO>) => {
      // First, create or resolve the course
      let createdCourse: CourseDTO | null = null;
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
      
      if (courseRes.ok) {
        createdCourse = await courseRes.json();
      } else {
        // Fallback: the course may already exist (unique constraint). Find it.
        try {
          const existing = await getJSON<CourseDTO[]>("/api/courses");
          createdCourse = existing.find(c => c.source === "canvas" && c.canvasId === course.canvasId) || null;
        } catch {}
        if (!createdCourse) throw new Error("Failed to create course");
      }
      
      // Then, fetch and import all assignments for this course (with status)
      const assignments = await listCanvasAssignments(course.canvasId!);
      const createdAssignments: AssignmentDTO[] = [];
      
      for (const a of assignments) {
        // Check if assignment already exists
        let existingAssignment = null;
        if (a.canvasId) {
          try {
            const existingRes = await fetch(`/api/assignments?canvasId=${a.canvasId}`);
            if (existingRes.ok) {
              const existingData = await existingRes.json();
              existingAssignment = existingData.find((assignment: any) =>
                assignment.canvasId === a.canvasId && assignment.source === "canvas"
              );
            }
          } catch (error) {
            // Ignore errors when checking for existing assignments
          }
        }

        if (existingAssignment) {
          // Assignment already exists, add it to the created list
          createdAssignments.push(existingAssignment);
        } else {
          // Assignment doesn't exist, create it
          const res = await fetch("/api/assignments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              courseId: createdCourse?.id, // Use the local database course ID, not Canvas ID
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
      }
      
      // Optionally trigger a lightweight status sync now that the course exists
      try { await fetch("/api/canvas/sync/user", { method: "POST" }); } catch {}
      return { course: createdCourse, assignments: createdAssignments };
    },
  });

  // Optional: deprecated bulk import kept for compatibility
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
        const localCourseId = a.courseId && canvasToLocalCourseMap.get(a.courseId);
        if (!localCourseId) continue;
        
        const res = await fetch("/api/assignments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            courseId: localCourseId,
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

export function useEnsureCanvasCoursesPrefetched() {
  const { status } = useSession();
  useEffect(() => {
    if (status === "authenticated") fetch("/api/canvas/courses").catch(() => {});
  }, [status]);
}


