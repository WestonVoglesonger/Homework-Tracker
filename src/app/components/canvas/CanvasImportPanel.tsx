"use client";
import { useEffect, useState } from "react";
import { useCanvasImport } from "@/app/hooks/useCanvasImport";
import { CourseDTO } from "@/interfaces/course";
import { Button } from "@components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { toast } from "sonner";

export default function CanvasImportPanel() {
  const { listCanvasCourses, importCourseWithAssignments } = useCanvasImport();
  const [courses, setCourses] = useState<CourseDTO[] | null>(null);
  const [selectedCourses, setSelectedCourses] = useState<Record<string, boolean>>({});
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    listCanvasCourses()
      .then((cs) => {
        setCourses(cs);
        // Preselect already-imported courses
        const pre: Record<string, boolean> = {};
        cs.forEach((c) => {
          if ((c as any).isImported && (c.canvasId || c.id)) pre[c.canvasId || c.id] = true;
        });
        if (Object.keys(pre).length) setSelectedCourses(pre);
      })
      .catch(() => setCourses([]));
    const onPurge = () => {
      listCanvasCourses()
        .then((cs) => {
          setCourses(cs);
          const pre: Record<string, boolean> = {};
          cs.forEach((c) => {
            if ((c as any).isImported && (c.canvasId || c.id)) pre[c.canvasId || c.id] = true;
          });
          setSelectedCourses(pre);
        })
        .catch(() => setCourses([]));
    };
    window.addEventListener("purge:done", onPurge);
    return () => window.removeEventListener("purge:done", onPurge);
  }, []);

  async function handleImport() {
    setImporting(true);
    const selected = courses?.filter((c) => selectedCourses[c.canvasId || c.id]) || [];

    let successCount = 0;
    let assignmentCount = 0;
    
    for (const course of selected) {
      try {
        const result = await importCourseWithAssignments.mutateAsync(course);
        successCount++;
        assignmentCount += result.assignments.length;
      } catch (error) {
        console.error(`Failed to import course ${course.name}:`, error);
        toast.error(`Failed to import ${course.name}`);
      }
    }
    
    if (successCount > 0) {
      toast.success(`Imported ${successCount} course${successCount > 1 ? 's' : ''} with ${assignmentCount} assignment${assignmentCount !== 1 ? 's' : ''}`);
      const refreshed = await listCanvasCourses();
      setCourses(refreshed);
      setSelectedCourses({});
    }
    
    setImporting(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import from Canvas</CardTitle>
      </CardHeader>
      <CardContent>
        {courses === null && <div className="text-sm text-muted-foreground">Loading Canvas courses...</div>}
        {courses && courses.length === 0 && (
          <div className="text-sm text-muted-foreground">
            No Canvas connection found.
          </div>
        )}
        <div className="space-y-2 mb-4">
          {courses?.map((c) => (
            <label key={c.canvasId || c.id} className="flex items-center gap-3 border rounded-lg p-3 hover:bg-accent/50 cursor-pointer">
              <input
                type="checkbox"
                checked={!!selectedCourses[c.canvasId || c.id]}
                onChange={(e) =>
                  setSelectedCourses((prev) => ({ ...prev, [c.canvasId || c.id]: e.target.checked }))
                }
                className="w-4 h-4"
              />
              <div className="flex-1">
                <div className="font-medium">{c.name}</div>
                <div className="text-sm text-muted-foreground">{[c.code, c.term].filter(Boolean).join(" • ")}</div>
              </div>
              {((c as any).isImported) && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200">Imported</span>
              )}
              {c.color && <div className="w-4 h-4 rounded" style={{ backgroundColor: c.color }} />}
            </label>
          ))}
        </div>
        {courses && courses.length > 0 && (
          <div className="space-y-3">
            {importing && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <div className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Importing courses...</strong><br />
                    This may take a minute or two depending on how many assignments your courses have.
                    Please don't close this page while the import is in progress.
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center">
              <Button
                disabled={importing || Object.values(selectedCourses).every((v) => !v)}
                onClick={handleImport}
              >
                {importing ? "Importing..." : "Import Selected Courses"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


