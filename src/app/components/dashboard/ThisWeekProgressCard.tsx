"use client";

import { useState, useEffect } from 'react';
import { DataCard } from '@components/ui/DataCard';
import { TrendingUp, Calendar, CheckCircle2, Target } from 'lucide-react';
import { useAssignments } from '@/app/hooks/useAssignments';

interface WeekData {
  totalThisWeek: number;
  completedThisWeek: number;
  plannedThisWeek: number;
  completionRate: number;
}

export function ThisWeekProgressCard() {
  const { data: assignments, isLoading } = useAssignments();
  const [weekData, setWeekData] = useState<WeekData | null>(null);

  useEffect(() => {
    if (!assignments) return;

    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Start of current week (Sunday)
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7); // End of current week

    // Filter assignments for this week
    const weekAssignments = assignments.filter(assignment => {
      if (!assignment.dueAt) return false;
      const dueDate = new Date(assignment.dueAt);
      return dueDate >= startOfWeek && dueDate < endOfWeek;
    });

    const totalThisWeek = weekAssignments.length;
    const completedThisWeek = weekAssignments.filter(a => a.status === "GRADED").length;
    const plannedThisWeek = weekAssignments.filter(a => a.status === "PLANNED").length;
    const completionRate = totalThisWeek > 0 ? Math.round((completedThisWeek / totalThisWeek) * 100) : 0;

    setWeekData({
      totalThisWeek,
      completedThisWeek,
      plannedThisWeek,
      completionRate,
    });
  }, [assignments]);

  const getSubtitle = () => {
    if (!weekData) return "Loading...";
    if (weekData.totalThisWeek === 0) return "No assignments this week!";
    if (weekData.completionRate === 100) return "Perfect week! 🎉";
    if (weekData.completionRate >= 80) return "Great progress!";
    if (weekData.completionRate >= 60) return "Good momentum";
    if (weekData.completionRate >= 40) return "Keep going!";
    return "Let's pick up the pace";
  };

  const getIcon = () => {
    if (!weekData) return <Calendar className="w-4 h-4" />;
    if (weekData.totalThisWeek === 0) return <Calendar className="w-4 h-4" />;
    if (weekData.completionRate === 100) return <CheckCircle2 className="w-4 h-4" />;
    if (weekData.completionRate >= 60) return <TrendingUp className="w-4 h-4" />;
    return <Target className="w-4 h-4" />;
  };

  const getColor = () => {
    if (!weekData) return 'gray';
    if (weekData.totalThisWeek === 0) return 'gray';
    if (weekData.completionRate === 100) return 'green';
    if (weekData.completionRate >= 80) return 'green';
    if (weekData.completionRate >= 60) return 'blue';
    if (weekData.completionRate >= 40) return 'orange';
    return 'red';
  };

  const getValue = () => {
    if (!weekData) return 0;
    if (weekData.totalThisWeek === 0) return "0";
    return `${weekData.completionRate}%`;
  };

  return (
    <DataCard
      title="This Week Progress"
      value={getValue()}
      subtitle={getSubtitle()}
      icon={getIcon()}
      color={getColor()}
      loading={isLoading}
    />
  );
}
