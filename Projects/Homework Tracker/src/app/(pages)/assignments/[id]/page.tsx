"use client";
import { useParams, useRouter } from "next/navigation";
import AppShell from "../../../../components/layout/AppShell";
import { useQuery } from "@tanstack/react-query";
import { AssignmentDTO } from "../../../../interfaces/assignment";
import { Button } from "../../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card";
import { Skeleton } from "../../../../components/ui/skeleton";
import { formatDate } from "../../../../lib/date";
import { useUpdateAssignment, useDeleteAssignment } from "../../../../hooks/useAssignments";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../components/ui/select";
import { toast } from "sonner";
import Link from "next/link";

async function getAssignment(id: string): Promise<AssignmentDTO> {
  const res = await fetch(`/api/assignments/${id}`);
  if (!res.ok) throw new Error("Failed to fetch assignment");
  return res.json();
}

export default function AssignmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  
  const { data: assignment, isLoading } = useQuery({
    queryKey: ["assignment", id],
    queryFn: () => getAssignment(id),
  });
  
  const updateAssignment = useUpdateAssignment();
  const deleteAssignment = useDeleteAssignment();
  
  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this assignment?")) {
      try {
        await deleteAssignment.mutateAsync(id);
        toast.success("Assignment deleted");
        router.push("/dashboard");
      } catch (error) {
        toast.error("Failed to delete assignment");
      }
    }
  };
  
  const statusColors = {
    TODO: "status-todo",
    IN_PROGRESS: "status-in-progress",
    DONE: "status-done"
  };
  
  const statusLabels = {
    TODO: "To Do",
    IN_PROGRESS: "In Progress",
    DONE: "Done"
  };

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-6">
        {isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-16 w-3/4" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </div>
            <Skeleton className="h-64" />
          </div>
        ) : assignment ? (
          <>
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                  {assignment.title}
                </h1>
                <div className="flex items-center gap-4 text-sm">
                  {assignment.type && (
                    <span className="px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                      {assignment.type}
                    </span>
                  )}
                  {assignment.source === "canvas" && (
                    <span className="px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700">
                      From Canvas
                    </span>
                  )}
                </div>
              </div>
              <Button 
                variant="destructive" 
                onClick={handleDelete}
                className="px-6"
              >
                Delete
              </Button>
            </div>
            
            {/* Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="card-hover">
                <CardHeader>
                  <CardTitle className="text-sm text-gray-600 dark:text-gray-400">Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select
                    value={assignment.status}
                    onValueChange={(value) => 
                      updateAssignment.mutate({ 
                        id, 
                        patch: { status: value as any } 
                      })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue>
                        <span className={statusColors[assignment.status]}>
                          {statusLabels[assignment.status]}
                        </span>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          <span className={statusColors[value as keyof typeof statusColors]}>
                            {label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
              
              <Card className="card-hover">
                <CardHeader>
                  <CardTitle className="text-sm text-gray-600 dark:text-gray-400">Due Date</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {assignment.dueAt ? formatDate(assignment.dueAt) : "No due date"}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="card-hover">
                <CardHeader>
                  <CardTitle className="text-sm text-gray-600 dark:text-gray-400">Priority</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {assignment.priority === 0 ? "Normal" : 
                     assignment.priority > 0 ? "High" : "Low"}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Description */}
            {assignment.description && (
              <Card className="card-hover">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white">Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <div 
                    className="prose prose-sm max-w-none text-gray-700 dark:text-gray-300"
                    dangerouslySetInnerHTML={{ __html: assignment.description }}
                  />
                </CardContent>
              </Card>
            )}
            
            {/* Notes */}
            <Card className="card-hover">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <textarea
                  className="w-full h-32 p-4 rounded-lg bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500/20 transition-colors text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 resize-none"
                  placeholder="Add your notes here..."
                  value={assignment.notes || ""}
                  onChange={(e) => 
                    updateAssignment.mutate({ 
                      id, 
                      patch: { notes: e.target.value } 
                    })
                  }
                />
              </CardContent>
            </Card>
            
            {/* Canvas Link */}
            {assignment.canvasUrl && (
              <div className="flex justify-center">
                <Button asChild className="px-8 py-3 text-lg">
                  <a href={assignment.canvasUrl} target="_blank" rel="noopener noreferrer">
                    View on Canvas
                  </a>
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Assignment not found</h2>
            <Button asChild variant="outline">
              <Link href="/dashboard">Back to Dashboard</Link>
            </Button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
