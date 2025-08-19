"use client";
import AppShell from "../../../components/layout/AppShell";
import { useAssignments } from "../../../hooks/useAssignments";
import { dueCategory } from "../../../lib/date";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { AssignmentRow } from "../../../components/assignments/AssignmentRow";
import EmptyState from "../../../components/common/EmptyState";
import { useEnsureCanvasCoursesPrefetched } from "../../../hooks/useCanvasImport";
import { Skeleton } from "../../../components/ui/skeleton";

export default function DashboardPage() {
  useEnsureCanvasCoursesPrefetched();
  const { data: assignments, isLoading } = useAssignments();
  const groups = { overdue: [], today: [], upcoming: [] } as Record<string, any[]>;
  
  for (const a of assignments || []) {
    const c = dueCategory(a.dueAt);
    if (c === "overdue") groups.overdue.push(a);
    else if (c === "today") groups.today.push(a);
    else if (c === "upcoming") groups.upcoming.push(a);
  }
  
  const totalAssignments = assignments?.length || 0;
  const completedAssignments = assignments?.filter(a => a.status === "DONE").length || 0;
  const completionRate = totalAssignments > 0 ? (completedAssignments / totalAssignments) * 100 : 0;
  
  const sections = [
    { key: "overdue", title: "Overdue", cardClass: "overdue-card", color: "text-red-700 dark:text-red-300", bgColor: "bg-red-100 dark:bg-red-900/30", borderColor: "border-red-200 dark:border-red-700" },
    { key: "today", title: "Today", cardClass: "today-card", color: "text-blue-700 dark:text-blue-300", bgColor: "bg-blue-100 dark:bg-blue-900/30", borderColor: "border-blue-200 dark:border-blue-700" },
    { key: "upcoming", title: "Upcoming", cardClass: "upcoming-card", color: "text-green-700 dark:text-green-300", bgColor: "bg-green-100 dark:bg-green-900/30", borderColor: "border-green-200 dark:border-green-700" },
  ] as const;

  return (
    <AppShell>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">Track your assignments and stay on top of deadlines</p>
        </div>

        {/* Stats Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {isLoading ? (
            <>
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
            </>
          ) : (
            <>
              <Card className="stat-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                    Total Assignments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                    {totalAssignments}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Across all courses
                  </div>
                </CardContent>
              </Card>
              <Card className="stat-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    Completed
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-green-600 mb-2">
                    {completedAssignments}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Great progress!
                  </div>
                </CardContent>
              </Card>
              <Card className="stat-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    In Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-blue-600 mb-2">
                    {assignments?.filter(a => a.status === "IN_PROGRESS").length || 0}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Keep going!
                  </div>
                </CardContent>
              </Card>
              <Card className="stat-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                    Completion Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-purple-600 mb-3">
                    {completionRate.toFixed(0)}%
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500 shadow-sm"
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

        {/* Assignment Groups */}
        <div className="grid lg:grid-cols-3 gap-6">
          {sections.map((s) => (
            <Card 
              key={s.key} 
              className={`assignment-card ${s.cardClass}`}
            >
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between">
                  <span className={`text-xl font-bold ${s.color}`}>{s.title}</span>
                  <span className={`px-4 py-2 rounded-full ${s.bgColor} ${s.color} border ${s.borderColor} font-semibold shadow-sm`}>
                    {groups[s.key].length}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-20" />
                    <Skeleton className="h-20" />
                  </div>
                ) : groups[s.key].length === 0 ? (
                  <EmptyState title={`No ${s.key} assignments`} />
                ) : (
                  <div className="space-y-3">
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


