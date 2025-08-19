"use client";
import AppShell from "../../../../components/layout/AppShell";
import { useAssignments } from "../../../../hooks/useAssignments";
import { AssignmentRow } from "../../../../components/assignments/AssignmentRow";
import AssignmentForm from "../../../../components/assignments/AssignmentForm";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card";
import EmptyState from "../../../../components/common/EmptyState";

export default function CourseDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { data } = useAssignments();
  const items = (data || []).filter((a) => a.courseId === id);
  return (
    <AppShell>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Course</h1>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <EmptyState title="No assignments yet" />
            ) : (
              <div className="divide-y">
                {items.map((a) => (
                  <AssignmentRow key={a.id} a={a} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
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


