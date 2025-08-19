"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CourseDTO } from "../interfaces/course";

async function getJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers || {}) } });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export function useCourses() {
  return useQuery<CourseDTO[]>({ queryKey: ["courses"], queryFn: () => getJSON("/api/courses") });
}

export function useCreateCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; code?: string; term?: string; color?: string; source?: "manual" | "canvas"; canvasId?: string }) =>
      getJSON<CourseDTO>("/api/courses", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["courses"] }),
  });
}

export function useUpdateCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<{ name: string; code?: string; term?: string; color?: string }> }) =>
      getJSON<CourseDTO>(`/api/courses/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["courses"] }),
  });
}

export function useDeleteCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => getJSON<{ ok: true }>(`/api/courses/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["courses"] }),
  });
}


