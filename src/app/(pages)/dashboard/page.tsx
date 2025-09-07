"use client";
import AppShell from "@components/layout/AppShell";
import { useAssignments } from "@/app/hooks/useAssignments";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { StatusPill } from "@components/ui/status";
import { normalizeStatus } from "@/lib/status";
import { AssignmentRow } from "@components/assignments/AssignmentRow";
import EmptyState from "@components/common/EmptyState";
import { useEnsureCanvasCoursesPrefetched } from "@/app/hooks/useCanvasImport";
import type { AssignmentDTO } from "@/interfaces/assignment";
import { Skeleton } from "@components/ui/skeleton";
import { Button } from "@components/ui/button";
import { RefreshCw, Clock, Users } from "lucide-react";
import { useState } from "react";
import { useSession } from "next-auth/react";

export default function DashboardPage() {
  const { data: session } = useSession();
  const isWaitlisted = Boolean((session?.user as { isWaitlisted?: boolean } | undefined)?.isWaitlisted);

  useEnsureCanvasCoursesPrefetched();
  const { data: assignments, isLoading, refetch } = useAssignments();
  const nowTs = Date.now();

  // State for refresh functionality
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // Waitlist status now comes from the session; no client-side Prisma calls

  const handleCanvasSync = async () => {
    setIsRefreshing(true);
    setSyncMessage(null);

    try {
      const response = await fetch('/api/canvas/sync/manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setLastSyncTime(new Date());
        setSyncMessage(`✅ Synced successfully! Updated ${result.results.assignments || 0} assignments.`);
        // Refresh the assignments data
        refetch();
      } else {
        setSyncMessage(`❌ Sync failed: ${result.error || "Unknown error"}`);
      }
    } catch (error) {
      setSyncMessage(`❌ Sync failed: ${error instanceof Error ? error.message : "Network error"}`);
    } finally {
      setIsRefreshing(false);
    }
  };
  const twoWeeksMs = 14 * 24 * 60 * 60 * 1000;
  const cutoffTs = nowTs + twoWeeksMs;
  const overdue = (assignments || []).filter((a) => {
    if (!a.dueAt) return false;
    const ts = Date.parse(a.dueAt);
    const st = normalizeStatus(a.status);
    // Treat SUBMITTED but ungraded as not overdue; only NOT_SUBMITTED counts as overdue
    return ts < nowTs && st === "NOT_SUBMITTED";
  });
  const upcoming = (assignments || [])
    .filter((a) => {
      if (!a.dueAt) return false;
      const ts = Date.parse(a.dueAt);
      // Only show items that have not been submitted yet
      const st = normalizeStatus(a.status);
      return ts >= nowTs && ts < cutoffTs && st === "NOT_SUBMITTED";
    })
    .sort((a, b) => Date.parse(a.dueAt as string) - Date.parse(b.dueAt as string));
  const groups: Record<string, AssignmentDTO[]> = { overdue, upcoming };
  
  const totalAssignments = assignments?.length || 0;
  const completedAssignments = assignments?.filter(a => a.status === "GRADED").length || 0;
  const completionRate = totalAssignments > 0 ? (completedAssignments / totalAssignments) * 100 : 0;
  
  const sections = [
    { 
      key: "overdue", 
      title: "Overdue", 
      cardClass: "overdue-card", 
      color: "text-red-700 dark:text-red-300", 
      bgColor: "bg-red-50 dark:bg-red-900/20", 
      borderColor: "border-red-200 dark:border-red-700",
      badgeColor: "bg-red-100 dark:bg-red-900/40"
    },
    { 
      key: "upcoming", 
      title: "Upcoming", 
      cardClass: "upcoming-card", 
      color: "text-green-700 dark:text-green-300", 
      bgColor: "bg-green-50 dark:bg-green-900/20", 
      borderColor: "border-green-200 dark:border-green-700",
      badgeColor: "bg-green-100 dark:bg-green-900/40"
    },
  ] as const;

  // Show waitlist message for waitlisted users
  if (isWaitlisted) {
    return (
      <AppShell>
        <div className="max-w-4xl mx-auto space-y-8 p-4 md:p-6">
          <div className="text-center">
            <div className="mx-auto w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-6">
              <Clock className="w-12 h-12 text-blue-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              You're on the Waitlist!
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
              Thank you for your interest in DueNorth. We've reached our current user limit, but you're on the list to get access as soon as space becomes available.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 text-center">
              <Users className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Stay Tuned</h3>
              <p className="text-gray-600 dark:text-gray-400">
                We'll notify you via email when your account becomes active.
              </p>
            </Card>

            <Card className="p-6 text-center">
              <Clock className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Limited Access</h3>
              <p className="text-gray-600 dark:text-gray-400">
                For now, you can access your settings and this dashboard.
              </p>
            </Card>

            <Card className="p-6 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-purple-600 font-bold text-xl">#</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Queue Position</h3>
              <p className="text-gray-600 dark:text-gray-400">
                You're in line and will be activated based on signup order.
              </p>
            </Card>
          </div>

          <Card className="p-8 text-center bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
            <h3 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
              What happens next?
            </h3>
            <div className="space-y-3 text-left max-w-2xl mx-auto">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-sm font-bold">1</span>
                </div>
                <p className="text-gray-700 dark:text-gray-300">
                  We'll continue adding users from the waitlist as space becomes available.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-sm font-bold">2</span>
                </div>
                <p className="text-gray-700 dark:text-gray-300">
                  You'll receive an email notification when your account is activated.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-sm font-bold">3</span>
                </div>
                <p className="text-gray-700 dark:text-gray-300">
                  Once activated, you'll have full access to all DueNorth features.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto space-y-8 p-4 md:p-6 overflow-hidden">
        {/* Header Section with more breathing room */}
        <div className="text-center lg:text-left">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-400 text-xl max-w-2xl">
                Track your assignments and stay on top of deadlines
              </p>
            </div>
            <div className="flex flex-col items-center lg:items-end gap-2">
              <Button
                onClick={handleCanvasSync}
                disabled={isRefreshing}
                className="flex items-center gap-2 min-w-[140px]"
                variant="outline"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Syncing...' : 'Sync Canvas'}
              </Button>
              {lastSyncTime && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Last synced: {lastSyncTime.toLocaleString()}
                </p>
              )}
              {syncMessage && (
                <p className={`text-sm ${syncMessage.startsWith('✅') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {syncMessage}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards with improved spacing */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 md:gap-8">
          {isLoading ? (
            <>
              <Skeleton className="h-36" />
              <Skeleton className="h-36" />
              <Skeleton className="h-36" />
              <Skeleton className="h-36" />
            </>
          ) : (
            <>
              <Card className="stat-card hover:shadow-lg transition-all duration-300 border-l-4 border-l-gray-400">
                <CardHeader className="pb-4">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                    Total Assignments
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-5xl font-bold text-gray-900 dark:text-white mb-3">
                    {totalAssignments}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Across all courses
                  </div>
                </CardContent>
              </Card>

              <Card className="stat-card hover:shadow-lg transition-all duration-300 border-l-4 border-l-green-500">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Graded</CardTitle>
                    <StatusPill status="GRADED" size="sm" variant="dot" />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-5xl font-bold text-green-600 mb-3">
                    {completedAssignments}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Great progress!
                  </div>
                </CardContent>
              </Card>

              <Card className="stat-card hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Submitted</CardTitle>
                    <StatusPill status="SUBMITTED" size="sm" variant="dot" />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-5xl font-bold text-blue-600 mb-3">
                    {assignments?.filter(a => a.status === "SUBMITTED").length || 0}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Keep going!
                  </div>
                </CardContent>
              </Card>

              <Card className="stat-card hover:shadow-lg transition-all duration-300 border-l-4 border-l-purple-500">
                <CardHeader className="pb-4">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                    Completion Rate
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-5xl font-bold text-purple-600 mb-4">
                    {completionRate.toFixed(0)}%
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-3">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-700 shadow-sm"
                      style={{ width: `${completionRate}%` }}
                    />
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {completionRate < 25 ? "Getting started" : completionRate < 50 ? "Making progress" : completionRate < 75 ? "Almost there" : "Excellent work!"}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Assignment Groups with better spacing */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 overflow-hidden">
          {sections.map((s) => (
            <Card 
              key={s.key} 
              className={`assignment-card ${s.cardClass} ${s.bgColor} ${s.borderColor} border-2 hover:shadow-lg transition-all duration-300`}
            >
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between">
                  <span className={`text-2xl font-bold ${s.color}`}>{s.title}</span>
                  <span className={`px-4 py-2 rounded-full ${s.badgeColor} ${s.color} border ${s.borderColor} font-bold text-lg min-w-[3rem] text-center shadow-sm`}>
                    {groups[s.key].length}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 pb-2">
                {isLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-24" />
                    <Skeleton className="h-24" />
                    <Skeleton className="h-24" />
                  </div>
                ) : groups[s.key].length === 0 ? (
                  <div className="py-8">
                    <EmptyState title={`No ${s.key} assignments`} />
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[16rem] overflow-y-auto">
                    {groups[s.key].map((a) => (
                      <AssignmentRow key={a.id} a={a} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}