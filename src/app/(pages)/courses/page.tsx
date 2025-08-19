"use client";
import AppShell from "../../../components/layout/AppShell";
import { useCourses } from "../../../hooks/useCourses";
import { CourseCard } from "../../../components/courses/CourseCard";
import { useCreateCourse } from "../../../hooks/useCourses";
import { useState } from "react";
import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";
import { useEnsureCanvasCoursesPrefetched } from "../../../hooks/useCanvasImport";
import EmptyState from "../../../components/common/EmptyState";
import Link from "next/link";
import { Skeleton } from "../../../components/ui/skeleton";

export default function CoursesPage() {
  useEnsureCanvasCoursesPrefetched();
  const { data, isLoading } = useCourses();
  const create = useCreateCourse();
  const [name, setName] = useState("");

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Courses</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage your courses and track assignments</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
            <form
              className="flex gap-3"
              onSubmit={async (e) => {
                e.preventDefault();
                await create.mutateAsync({ name });
                setName("");
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
                disabled={!name}
                className="px-6"
              >
                Add Course
              </Button>
            </form>
          </div>
        </div>

        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : data && data.length === 0 ? (
          <div className="mt-16 text-center">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 border border-gray-200 dark:border-gray-700 max-w-md mx-auto shadow-sm">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No courses yet</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">Get started by adding a course manually or importing from Canvas.</p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" asChild>
                  <Link href="/settings">Import from Canvas</Link>
                </Button>
              </div>
            </div>
          </div>
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


