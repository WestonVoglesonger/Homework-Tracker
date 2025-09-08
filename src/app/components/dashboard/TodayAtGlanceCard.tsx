"use client";

import { useState, useEffect } from 'react';
import { DataCard } from '@components/ui/DataCard';
import { Calendar, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { useAssignments } from '@/app/hooks/useAssignments';
import { normalizeStatus } from '@/lib/status';

interface TodayData {
  totalToday: number;
  completedToday: number;
  dueToday: number;
  plannedToday: number;
}

export function TodayAtGlanceCard() {
  const { data: assignments, isLoading } = useAssignments();
  const [todayData, setTodayData] = useState<TodayData | null>(null);

  useEffect(() => {
    if (!assignments) return;

    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    // Filter assignments for today
    const todayAssignments = assignments.filter(assignment => {
      if (!assignment.dueAt) return false;
      const dueDate = new Date(assignment.dueAt);
      return dueDate >= startOfToday && dueDate < endOfToday;
    });

    const totalToday = todayAssignments.length;
    const completedToday = todayAssignments.filter(a => a.status === "GRADED").length;
    const dueToday = todayAssignments.filter(a => normalizeStatus(a.status) === "NOT_SUBMITTED").length;
    const plannedToday = todayAssignments.filter(a => a.status === "PLANNED").length;

    setTodayData({
      totalToday,
      completedToday,
      dueToday,
      plannedToday,
    });
  }, [assignments]);

  const getSubtitle = () => {
    if (!todayData) return "Loading...";
    if (todayData.totalToday === 0) return "No assignments today!";
    if (todayData.completedToday === todayData.totalToday) return "All done for today! 🎉";
    
    const remainingToday = todayData.totalToday - todayData.completedToday;
    if (remainingToday > 0) return `${remainingToday} still need attention`;
    return "Keep up the momentum!";
  };

  const getIcon = () => {
    if (!todayData) return <Calendar className="w-4 h-4" />;
    if (todayData.totalToday === 0) return <Calendar className="w-4 h-4" />;
    if (todayData.completedToday === todayData.totalToday) return <CheckCircle2 className="w-4 h-4" />;
    if (todayData.dueToday > 0) return <AlertCircle className="w-4 h-4" />;
    return <Clock className="w-4 h-4" />;
  };

  const getColor = () => {
    if (!todayData) return 'gray';
    if (todayData.totalToday === 0) return 'gray';
    if (todayData.completedToday === todayData.totalToday) return 'green';
    if (todayData.dueToday > 0) return 'red';
    return 'orange';
  };

  const getValue = () => {
    if (!todayData) return 0;
    if (todayData.totalToday === 0) return "0";
    return `${todayData.completedToday}/${todayData.totalToday}`;
  };

  return (
    <DataCard
      title="Due Today"
      value={getValue()}
      subtitle={getSubtitle()}
      icon={getIcon()}
      color={getColor()}
      loading={isLoading}
    />
  );
}
