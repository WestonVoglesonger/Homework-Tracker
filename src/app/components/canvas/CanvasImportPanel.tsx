"use client";
import { useEffect, useState } from "react";
import { useCanvasImport } from "../../hooks/useCanvasImport";
import { CourseDTO } from "../../interfaces/course";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { toast } from "sonner";

export default function CanvasImportPanel() {
  const { listCanvasCourses, importCourseWithAssignments, startOAuth } = useCanvasImport();
  const [courses, setCourses] = useState<CourseDTO[] | null>(null);
  const [selectedCourses, setSelectedCourses] = useState<Record<string, boolean>>({});
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    listCanvasCourses()
      .then((cs) => setCourses(cs))
      .catch(() => setCourses([]));
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
      // Refresh the course list
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
            No Canvas connection. <Button variant="link" onClick={() => startOAuth()}>Connect to Canvas</Button>
          </div>
        )}
        <div className="space-y-2 mb-4">
          {courses?.map((c) => (
            <label key={c.canvasId} className="flex items-center gap-3 border rounded-lg p-3 hover:bg-accent/50 cursor-pointer">
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
              {c.color && <div className="w-4 h-4 rounded" style={{ backgroundColor: c.color }} />}
            </label>
          ))}
        </div>
        {courses && courses.length > 0 && (
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Importing a course will also import all its assignments
            </p>
            <Button
              disabled={importing || Object.values(selectedCourses).every((v) => !v)}
              onClick={handleImport}
            >
              {importing ? "Importing..." : "Import Selected Courses"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


