"use client";
import React from "react";

import { normalizeStatus, AppStatus } from "@/lib/status";

export const statusMeta: Record<AppStatus, { short: string; long: string; dot: string; pill: string }> = {
  NOT_SUBMITTED: {
    short: "Not submitted",
    long: "Not submitted",
    dot: "bg-gray-400",
    pill: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700",
  },
  SUBMITTED: {
    short: "Submitted",
    long: "Submitted, waiting for grade",
    dot: "bg-blue-500",
    pill: "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800",
  },
  GRADED: {
    short: "Graded",
    long: "Submitted and graded",
    dot: "bg-green-500",
    pill: "bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800",
  },
};


export function StatusPill({ status, size = "md", variant = "pill" }: { status: string; size?: "sm" | "md"; variant?: "pill" | "dot" }) {
  const s = normalizeStatus(status);
  const m = statusMeta[s];

  // Fallback to NOT_SUBMITTED if statusMeta entry doesn't exist
  if (!m) {
    console.warn(`Unknown status: ${status}, falling back to NOT_SUBMITTED`);
  }

  const fallbackMeta = statusMeta.NOT_SUBMITTED;
  const meta = m || fallbackMeta;

  const sizeClasses = size === "sm" ? "gap-1 px-1.5 py-0.5 text-[11px]" : "gap-2 px-2 py-1 text-xs";
  const dotClasses = size === "sm" ? "w-1.5 h-1.5" : "w-2 h-2";

  if (variant === "dot") {
    return (
      <span className="inline-flex items-center" title={meta.long}>
        <span className={`${dotClasses} rounded-full ${meta.dot}`} />
        <span className="sr-only">{meta.short}</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center ${sizeClasses} rounded-full leading-none font-medium ${meta.pill}`}
      title={meta.long}
    >
      <span className={`${dotClasses} rounded-full ${meta.dot}`} />
      {meta.short}
    </span>
  );
}


