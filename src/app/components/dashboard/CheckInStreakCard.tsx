"use client";
import { DataCard } from '@components/ui/DataCard';
import { Flame, CheckCircle2 } from 'lucide-react';
import { useStreak } from '@/app/hooks/useStreak';

export function CheckInStreakCard() {
  const { data: streakData, isLoading, recordStudy, isRecording } = useStreak();

  const handleStudy = async () => {
    if (!streakData?.hasStudiedToday) {
      try { await recordStudy(); } catch (error) { console.error('Failed to study:', error); }
    }
  };

  const getStreakColor = () => {
    if (!streakData) return 'gray';
    if (streakData.streakStatus === 'active') return 'green';
    if (streakData.streakStatus === 'at_risk') return 'orange';
    if (streakData.streakStatus === 'broken') return 'red';
    return 'gray';
  };

  const getStreakIcon = () => {
    if (!streakData) return <Flame className="w-4 h-4" />;
    if (streakData.streakStatus === 'active') return <CheckCircle2 className="w-4 h-4" />;
    return <Flame className="w-4 h-4" />;
  };

  const getSubtitle = () => {
    if (!streakData) return "Loading...";
    if (streakData.hasStudiedToday) return "Studied today!";
    if (streakData.streakStatus === 'at_risk') return "Don't break your streak!";
    if (streakData.streakStatus === 'broken') return "Start fresh today!";
    return "Study today (2 min)";
  };

  const getTrend = () => {
    // Don't show trend for streak cards - it's confusing
    return undefined;
  };

  const getStreakValue = () => {
    const streak = streakData?.currentStreak || 0;
    
    if (streak >= 100) {
      return (
        <div className="relative">
          <span className="text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-500 bg-clip-text text-transparent animate-pulse">
            {streak}
          </span>
          <div className="absolute -top-1 -right-1 text-lg">👑</div>
        </div>
      );
    } else if (streak >= 50) {
      return (
        <span className="text-5xl font-bold bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent">
          {streak}
        </span>
      );
    } else if (streak >= 25) {
      return (
        <span className="text-5xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
          {streak}
        </span>
      );
    } else if (streak >= 10) {
      return (
        <span className="text-5xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
          {streak}
        </span>
      );
    } else if (streak >= 5) {
      return (
        <span className="text-5xl font-bold bg-gradient-to-r from-green-500 to-blue-500 bg-clip-text text-transparent">
          {streak}
        </span>
      );
    } else {
      return (
        <span className="text-5xl font-bold text-gray-600">
          {streak}
        </span>
      );
    }
  };

  return (
    <DataCard
      title="Study Streak"
      value={getStreakValue()}
      subtitle={getSubtitle()}
      icon={getStreakIcon()}
      color={getStreakColor()}
      onClick={streakData && !streakData.hasStudiedToday ? handleStudy : undefined}
      loading={isLoading || isRecording}
      trend={getTrend()}
      className={streakData && !streakData.hasStudiedToday ? "cursor-pointer hover:ring-2 hover:ring-blue-500 hover:ring-opacity-50" : ""}
    />
  );
}
