"use client";

import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface StreakSummary {
  currentStreak: number;
  longestStreak: number;
  lastStudiedDate: string | null;
  lastResetDate: string | null;
  hasStudiedToday: boolean;
  streakStatus: "active" | "at_risk" | "broken" | "inactive";
  daysSinceLastStudied: number;
  recentCheckIns: Array<{ date: string; streakCount: number }>;
}

async function getJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers || {}) } });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export function useStreak() {
  const qc = useQueryClient();

  const streakQuery = useQuery<StreakSummary>({
    queryKey: ["streak"],
    queryFn: () => getJSON<StreakSummary>("/api/streak"),
    staleTime: 60_000,
  });

  const studyMutation = useMutation({
    mutationFn: () => getJSON<StreakSummary>("/api/checkin", { method: "POST" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["streak"] });
    },
  });

  const recordStudy = useCallback(() => studyMutation.mutateAsync(), [studyMutation]);

  return {
    data: streakQuery.data,
    isLoading: streakQuery.isLoading,
    error: streakQuery.error,
    refetch: streakQuery.refetch,
    recordStudy,
    isRecording: studyMutation.isPending,
  } as const;
}


