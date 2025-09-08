"use client";

import { useState, useEffect } from 'react';
import { DataCard } from '@components/ui/DataCard';
import { Flame, CheckCircle2 } from 'lucide-react';
import { useSession } from 'next-auth/react';

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastStudiedDate: string | null;
  lastResetDate: string | null;
  hasStudiedToday: boolean;
  streakStatus: 'active' | 'at_risk' | 'broken' | 'inactive';
  daysSinceLastStudied: number;
}

export function CheckInStreakCard() {
  const { data: session } = useSession();
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStudying, setIsStudying] = useState(false);

  const fetchStreakData = async () => {
    try {
      const response = await fetch('/api/streak');
      if (response.ok) {
        const data = await response.json();
        setStreakData(data);
      }
    } catch (error) {
      console.error('Failed to fetch streak data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user) {
      fetchStreakData();
    }
  }, [session]);

  const handleStudy = async () => {
    if (!streakData?.hasStudiedToday) {
      setIsStudying(true);
      try {
        const response = await fetch('/api/checkin', {
          method: 'POST',
        });

        if (response.ok) {
          const data = await response.json();
          setStreakData(prev => prev ? {
            ...prev,
            currentStreak: data.streak.currentStreak,
            hasStudiedToday: true,
            lastStudiedDate: data.streak.lastStudiedDate,
            streakStatus: 'active',
            daysSinceLastStudied: 0,
          } : null);
        }
      } catch (error) {
        console.error('Failed to study:', error);
      } finally {
        setIsStudying(false);
      }
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

  return (
    <DataCard
      title="Study Streak"
      value={streakData?.currentStreak || 0}
      subtitle={getSubtitle()}
      icon={getStreakIcon()}
      color={getStreakColor()}
      onClick={streakData && !streakData.hasStudiedToday ? handleStudy : undefined}
      loading={isLoading || isStudying}
      trend={getTrend()}
      className={streakData && !streakData.hasStudiedToday ? "cursor-pointer hover:ring-2 hover:ring-blue-500 hover:ring-opacity-50" : ""}
    />
  );
}
