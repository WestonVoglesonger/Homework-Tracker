"use client";

import { useState, useEffect } from 'react';
import { DataCard } from '@components/ui/DataCard';
import { Plus, Calendar, CheckSquare, Target } from 'lucide-react';
import { useAssignments } from '@/app/hooks/useAssignments';
import { normalizeStatus } from '@/lib/status';

interface QuickActionsData {
  upcomingCount: number;
  plannedCount: number;
  overdueCount: number;
  nextDueDate: string | null;
}

export function QuickActionsCard() {
  const { data: assignments, isLoading } = useAssignments();
  const [actionsData, setActionsData] = useState<QuickActionsData | null>(null);

  useEffect(() => {
    if (!assignments) return;

    const now = Date.now();
    const twoWeeksMs = 14 * 24 * 60 * 60 * 1000;
    const cutoffTs = now + twoWeeksMs;

    const upcoming = assignments.filter(a => {
      if (!a.dueAt) return false;
      const ts = Date.parse(a.dueAt);
      const st = normalizeStatus(a.status);
      return ts >= now && ts < cutoffTs && st === "NOT_SUBMITTED";
    });

    const planned = assignments.filter(a => a.status === "PLANNED");
    const overdue = assignments.filter(a => {
      if (!a.dueAt) return false;
      const ts = Date.parse(a.dueAt);
      const st = normalizeStatus(a.status);
      return ts < now && st === "NOT_SUBMITTED";
    });

    // Find next due date
    const nextDue = upcoming.sort((a, b) => Date.parse(a.dueAt as string) - Date.parse(b.dueAt as string))[0];
    const nextDueDate = nextDue ? new Date(nextDue.dueAt as string).toLocaleDateString() : null;

    setActionsData({
      upcomingCount: upcoming.length,
      plannedCount: planned.length,
      overdueCount: overdue.length,
      nextDueDate,
    });
  }, [assignments]);

  const getSubtitle = () => {
    if (!actionsData) return "Loading...";
    if (actionsData.overdueCount > 0) return `Overdue assignments need attention`;
    if (actionsData.upcomingCount > 0) return `Next due: ${actionsData.nextDueDate}`;
    if (actionsData.plannedCount > 0) return `Planned assignments ready to work on`;
    return "All caught up! 🎉";
  };

  const getIcon = () => {
    if (!actionsData) return <Target className="w-4 h-4" />;
    if (actionsData.overdueCount > 0) return <CheckSquare className="w-4 h-4" />;
    if (actionsData.upcomingCount > 0) return <Calendar className="w-4 h-4" />;
    if (actionsData.plannedCount > 0) return <Plus className="w-4 h-4" />;
    return <Target className="w-4 h-4" />;
  };

  const getColor = () => {
    if (!actionsData) return 'gray';
    if (actionsData.overdueCount > 0) return 'red';
    if (actionsData.upcomingCount > 0) return 'orange';
    if (actionsData.plannedCount > 0) return 'blue';
    return 'green';
  };

  const getValue = () => {
    if (!actionsData) return 0;
    if (actionsData.overdueCount > 0) return actionsData.overdueCount;
    if (actionsData.upcomingCount > 0) return actionsData.upcomingCount;
    if (actionsData.plannedCount > 0) return actionsData.plannedCount;
    return "0";
  };

  const getTitle = () => {
    if (!actionsData) return "Quick Actions";
    if (actionsData.overdueCount > 0) return "Overdue";
    if (actionsData.upcomingCount > 0) return "Upcoming";
    if (actionsData.plannedCount > 0) return "Planned";
    return "All Caught Up";
  };

  return (
    <DataCard
      title={getTitle()}
      value={getValue()}
      subtitle={getSubtitle()}
      icon={getIcon()}
      color={getColor()}
      loading={isLoading}
    />
  );
}
