"use client";
import { useMutation } from "@tanstack/react-query";

export function useAdmin() {
  const purgeAll = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/purge", { method: "POST" });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  });
  return { purgeAll };
}


