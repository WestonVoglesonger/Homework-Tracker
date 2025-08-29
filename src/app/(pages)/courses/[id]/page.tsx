"use client";
import AppShell from "@components/layout/AppShell";
import { useAssignments } from "@/app/hooks/useAssignments";
import { AssignmentRow } from "@components/assignments/AssignmentRow";
import AssignmentForm from "@components/assignments/AssignmentForm";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import EmptyState from "@components/common/EmptyState";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/ui/select";
import { useMemo, useState } from "react";

export default function CourseDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { data } = useAssignments();
  const items = (data || []).filter((a) => a.courseId === id);

  const [sort, setSort] = useState<"earliest" | "latest">("earliest");

  const sortedItems = useMemo(() => {
    const arr = [...items];
    arr.sort((a, b) => {
      const aHasDue = !!a.dueAt;
      const bHasDue = !!b.dueAt;
      if (aHasDue && bHasDue) {
        const aTime = Date.parse(a.dueAt as string);
        const bTime = Date.parse(b.dueAt as string);
        return sort === "earliest" ? aTime - bTime : bTime - aTime;
      }
      if (aHasDue && !bHasDue) return -1;
      if (!aHasDue && bHasDue) return 1;
      return 0;
    });
    return arr;
  }, [items, sort]);
  return (
    <AppShell>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Course</h1>
      </div>
      <div className="grid gap-6 md:grid-cols-[55%_45%]">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <CardTitle>Assignments</CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Sort by</span>
                <Select value={sort} onValueChange={(v) => setSort(v as any)}>
                  <SelectTrigger className="w-44 h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="earliest">Earliest due date</SelectItem>
                    <SelectItem value="latest">Latest due date</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <EmptyState title="No assignments yet" />
            ) : (
              <div className="divide-y">
                {sortedItems.map((a) => (
                  <AssignmentRow key={a.id} a={a} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="md:sticky md:top-6 h-fit">
          <CardHeader>
            <CardTitle>Add assignment</CardTitle>
          </CardHeader>
          <CardContent>
            <AssignmentForm courseId={id} />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}


