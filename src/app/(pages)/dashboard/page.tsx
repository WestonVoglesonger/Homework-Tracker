"use client";
import AppShell from "@components/layout/AppShell";
import { useAssignments } from "@/app/hooks/useAssignments";
 
import { normalizeStatus } from "@/lib/status";
import { AssignmentRow } from "@components/assignments/AssignmentRow";
import { NoAssignmentsEmptyState } from "@components/ui/EmptyState";
import { useEnsureCanvasCoursesPrefetched } from "@/app/hooks/useCanvasImport";
import type { AssignmentDTO } from "@/interfaces/assignment";
import { SkeletonCard, LoadingButton } from "@components/ui/LoadingState";
import { Skeleton } from "@components/ui/skeleton";
import { DataCard, StatCardsGrid } from "@components/ui/DataCard";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { PageHeader } from "@components/navigation/EnhancedNavigation";
import { RefreshCw, BarChart2, CheckCircle2, UploadCloud, Gauge } from "lucide-react";
import { useState } from "react";
import { useSession } from "next-auth/react";
import WaitlistNotice from "@components/waitlist/WaitlistNotice";

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
        <WaitlistNotice />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto space-y-8 p-4 md:p-6 overflow-visible">
        {/* Header Section with centralized navigation */}
        <PageHeader
          title="Dashboard"
          description="Track your assignments and stay on top of deadlines"
          actions={
            <div className="flex flex-col items-end gap-2">
               <LoadingButton
                 onClick={handleCanvasSync}
                 loading={isRefreshing}
                 loadingText="Syncing..."
                 className="flex items-center gap-2 min-w-[140px] px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 <RefreshCw className="h-4 w-4" />
                 Sync Canvas
               </LoadingButton>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Last synced: {lastSyncTime ? lastSyncTime.toLocaleString() : 'Not yet'}
              </p>
              {syncMessage && (
                <p className={`text-sm ${syncMessage.startsWith('✅') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {syncMessage}
                </p>
              )}
            </div>
          }
        />

        {/* Stats Cards with improved spacing */}
        <StatCardsGrid>
          {isLoading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : (
            <>
              <DataCard
                title="Total Assignments"
                value={totalAssignments}
                subtitle="Across all courses"
                icon={<BarChart2 className="w-4 h-4" />}
                color="gray"
              />

              <DataCard
                title="Graded"
                value={completedAssignments}
                subtitle="Great progress!"
                icon={<CheckCircle2 className="w-4 h-4" />}
                color="green"
              />

              <DataCard
                title="Submitted"
                value={assignments?.filter(a => a.status === "SUBMITTED").length || 0}
                subtitle="Keep going!"
                icon={<UploadCloud className="w-4 h-4" />}
                color="blue"
              />

              <DataCard
                title="Completion Rate"
                value={`${completionRate.toFixed(0)}%`}
                subtitle={completionRate < 25 ? "Getting started" : completionRate < 50 ? "Making progress" : completionRate < 75 ? "Almost there" : "Excellent work!"}
                icon={<Gauge className="w-4 h-4" />}
                color="purple"
              />
            </>
          )}
        </StatCardsGrid>

        {/* Assignment Groups with better spacing */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 overflow-visible">
          {sections.map((s) => (
            <Card 
              key={s.key} 
              className={`assignment-card ${s.cardClass} ${s.bgColor} ${s.borderColor} border-2 hover:shadow-lg transition-all duration-300`}
            >
              <CardHeader className="pb-2">
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
                  <div className="py-4">
                    <NoAssignmentsEmptyState title={`No ${s.key} assignments`} showCanvasCta={false} />
                  </div>
                ) : (
                  <div className="space-y-2 h-[13rem] md:h-[19rem] overflow-y-auto">
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