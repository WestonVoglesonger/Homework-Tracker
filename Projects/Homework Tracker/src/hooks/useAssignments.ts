"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AssignmentDTO, AssignmentStatus } from "../interfaces/assignment";

async function getJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers || {}) } });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export function useAssignments(params?: { status?: AssignmentStatus; from?: string; to?: string }) {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.from) query.set("from", params.from);
  if (params?.to) query.set("to", params.to);
  const qs = query.toString();
  const url = `/api/assignments${qs ? `?${qs}` : ""}`;
  return useQuery<AssignmentDTO[]>({ queryKey: ["assignments", params || {}], queryFn: () => getJSON(url) });
}

export function useCreateAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: any) => getJSON<AssignmentDTO>("/api/assignments", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["assignments"] }),
  });
}

export function useUpdateAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: any }) => getJSON<AssignmentDTO>(`/api/assignments/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["assignments"] }),
  });
}

export function useDeleteAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => getJSON<{ ok: true }>(`/api/assignments/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["assignments"] }),
  });
}


