"use client";
import AppShell from "@components/layout/AppShell";
import { useCourses, useCreateCourse } from "@/app/hooks/useCourses";
import { CourseCard } from "@components/courses/CourseCard";
import { useState } from "react";
import { Input } from "@components/ui/input";
import { Button } from "@components/ui/button";
import { useEnsureCanvasCoursesPrefetched } from "@/app/hooks/useCanvasImport";
import { SkeletonGrid } from "@components/ui/LoadingState";
import { NoCoursesEmptyState } from "@components/ui/EmptyState";
import { FormCard } from "@components/ui/DataCard";
import { PageHeader } from "@components/navigation/EnhancedNavigation";
import { useErrorHandler } from "@/app/hooks/useErrorHandler";

export default function CoursesPage() {
  useEnsureCanvasCoursesPrefetched();
  const { data, isLoading } = useCourses();
  const create = useCreateCourse();
  const { handleError, handleSuccess } = useErrorHandler();
  const [name, setName] = useState("");

  return (
    <AppShell>
      <div className="space-y-8">
        <PageHeader
          title="Courses"
          description="Manage your courses and track assignments"
          actions={
            <FormCard>
              <form
                className="flex gap-3"
                onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    await create.mutateAsync({ name });
                    handleSuccess("Course created successfully!", { operation: "create_course" });
                    setName("");
                  } catch (error) {
                    handleError(error instanceof Error ? error : new Error("Failed to create course"), {
                      operation: "create_course"
                    });
                  }
                }}
              >
                <Input
                  placeholder="New course name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-64"
                />
                <Button
                  type="submit"
                  disabled={!name || create.isPending}
                  className="px-6"
                >
                  {create.isPending ? "Creating..." : "Add Course"}
                </Button>
              </form>
            </FormCard>
          }
        />

        {isLoading ? (
          <SkeletonGrid rows={6} height="h-32" className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" />
        ) : data && data.length === 0 ? (
          <NoCoursesEmptyState className="mt-16" />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {(data || []).map((c) => (
              <CourseCard key={c.id} id={c.id} name={c.name} code={c.code} term={c.term} color={c.color} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}


