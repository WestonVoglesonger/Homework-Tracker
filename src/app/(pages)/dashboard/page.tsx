"use client";
import AppShell from "@components/layout/AppShell";
import { useAssignments } from "@/app/hooks/useAssignments";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { StatusPill } from "@components/ui/status";
import { AssignmentRow } from "@components/assignments/AssignmentRow";
import EmptyState from "@components/common/EmptyState";
import { useEnsureCanvasCoursesPrefetched } from "@/app/hooks/useCanvasImport";
import { Skeleton } from "@components/ui/skeleton";

export default function DashboardPage() {
  useEnsureCanvasCoursesPrefetched();
  const { data: assignments, isLoading } = useAssignments();
  const nowTs = Date.now();
  const twoWeeksMs = 14 * 24 * 60 * 60 * 1000;
  const cutoffTs = nowTs + twoWeeksMs;
  const overdue = (assignments || []).filter((a) => a.dueAt && Date.parse(a.dueAt) < nowTs && a.status === "NOT_SUBMITTED");
  const upcoming = (assignments || [])
    .filter((a) => {
      if (!a.dueAt) return false;
      const ts = Date.parse(a.dueAt);
      return ts >= nowTs && ts < cutoffTs;
    })
    .sort((a, b) => Date.parse(a.dueAt as string) - Date.parse(b.dueAt as string));
  const groups = { overdue, upcoming } as Record<string, any[]>;
  
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

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto space-y-10 p-6">
        {/* Header Section with more breathing room */}
        <div className="text-center lg:text-left">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 text-xl max-w-2xl">
            Track your assignments and stay on top of deadlines
          </p>
        </div>

        {/* Stats Cards with improved spacing */}
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-8">
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
        <div className="grid lg:grid-cols-2 gap-8">
          {sections.map((s) => (
            <Card 
              key={s.key} 
              className={`assignment-card ${s.cardClass} ${s.bgColor} ${s.borderColor} border-2 hover:shadow-lg transition-all duration-300`}
            >
              <CardHeader className="pb-6">
                <CardTitle className="flex items-center justify-between">
                  <span className={`text-2xl font-bold ${s.color}`}>{s.title}</span>
                  <span className={`px-4 py-2 rounded-full ${s.badgeColor} ${s.color} border ${s.borderColor} font-bold text-lg min-w-[3rem] text-center shadow-sm`}>
                    {groups[s.key].length}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
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
                  <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
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