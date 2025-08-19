"use client";
import AppShell from "../../../components/layout/AppShell";
import { useAssignments } from "../../../hooks/useAssignments";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { format, addDays, startOfDay, isSameDay, parseISO, isToday, isPast } from "date-fns";
import { AssignmentRow } from "../../../components/assignments/AssignmentRow";
import EmptyState from "../../../components/common/EmptyState";
import { useEnsureCanvasCoursesPrefetched } from "../../../hooks/useCanvasImport";
import { Skeleton } from "../../../components/ui/skeleton";

export default function CalendarPage() {
  useEnsureCanvasCoursesPrefetched();
  const { data, isLoading } = useAssignments();
  const start = startOfDay(new Date());
  const days = Array.from({ length: 21 }, (_, i) => addDays(start, i));

  const assignmentsByDay = days.map((day) => ({
    day,
    items: (data || []).filter((a) => (a.dueAt ? isSameDay(parseISO(a.dueAt), day) : false)),
  }));

  // Group by weeks
  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Calendar</h1>
          <p className="text-gray-600 dark:text-gray-400">View your assignments for the next 3 weeks</p>
        </div>

        {isLoading ? (
          <div className="space-y-8">
            {[...Array(3)].map((_, weekIndex) => (
              <div key={weekIndex}>
                <Skeleton className="h-6 w-48 mb-4" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3">
                  {[...Array(7)].map((_, i) => (
                    <Skeleton key={i} className="h-32" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-8">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex}>
                <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">
                  <span className="text-blue-600 dark:text-blue-400">
                    Week {weekIndex + 1}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400 ml-2">
                    {format(week[0], "MMM d")} - {format(week[6], "MMM d")}
                  </span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
                  {week.map((day) => {
                    const dayData = assignmentsByDay.find(d => isSameDay(d.day, day));
                    const hasAssignments = dayData && dayData.items.length > 0;
                    const dayIsPast = isPast(day) && !isToday(day);
                    const dayIsToday = isToday(day);

                    return (
                      <Card
                        key={day.toISOString()}
                        className={`group relative overflow-hidden card-hover border transition-all duration-200 ${
                          dayIsToday 
                            ? "border-blue-500 shadow-lg shadow-blue-500/20" 
                            : "border-gray-200 dark:border-gray-700"
                        } ${dayIsPast ? "opacity-60" : ""}`}
                      >
                        {/* Today highlight */}
                        {dayIsToday && (
                          <div className="absolute inset-0 bg-blue-50 dark:bg-blue-900/20" />
                        )}
                        
                        {/* Assignment count indicator */}
                        {hasAssignments && (
                          <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm">
                            {dayData.items.length}
                          </div>
                        )}

                        <CardHeader className="relative pb-2">
                          <CardTitle className="text-sm flex items-center justify-between">
                            <span className={`font-bold ${
                              dayIsToday 
                                ? "text-blue-600" 
                                : "text-gray-900 dark:text-white"
                            } transition-colors`}>
                              {format(day, "EEE")}
                            </span>
                            <span className={`text-lg font-bold ${
                              dayIsToday 
                                ? "text-blue-600" 
                                : "text-gray-700 dark:text-gray-300"
                            } transition-colors`}>
                              {format(day, "d")}
                            </span>
                          </CardTitle>
                        </CardHeader>
                        
                        <CardContent className="relative">
                          {!hasAssignments ? (
                            <div className="text-xs text-gray-500 dark:text-gray-400 text-center py-6 italic">
                              No assignments
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {dayData.items.map((a) => (
                                <div 
                                  key={a.id} 
                                  className="group/item text-xs p-2 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 transition-all duration-200"
                                >
                                  <div className="font-medium text-gray-900 dark:text-white truncate group-hover/item:text-blue-600 dark:group-hover/item:text-blue-400 transition-colors">
                                    {a.title}
                                  </div>
                                  <div className="text-gray-500 dark:text-gray-400 mt-1">
                                    {a.dueAt && format(parseISO(a.dueAt), "h:mm a")}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
