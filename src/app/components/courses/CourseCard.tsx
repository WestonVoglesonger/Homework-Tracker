"use client";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { useDeleteCourse } from "@/app/hooks/useCourses";
import { Spinner } from "@components/ui/spinner";
import { DeleteCourseConfirmation } from "@components/ui/DeleteConfirmation";
import { useErrorHandler } from "@/app/hooks/useErrorHandler";

export function CourseCard({ id, name, code, term, color }: {
  id: string;
  name: string;
  code?: string;
  term?: string;
  color?: string
}) {
  const del = useDeleteCourse();
  const { handleError, handleSuccess } = useErrorHandler();
  const colors = [
    "from-blue-500 to-blue-600",
    "from-green-500 to-green-600", 
    "from-purple-500 to-purple-600",
    "from-orange-500 to-orange-600",
    "from-red-500 to-red-600",
    "from-indigo-500 to-indigo-600"
  ];
  
  // Use a consistent color based on course ID
  const colorIndex = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
  const gradient = colors[colorIndex];

  return (
    <Card className="group relative overflow-hidden card-hover bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      {del.isPending && (
        <div className="absolute inset-0 bg-white/70 dark:bg-black/50 backdrop-blur-sm grid place-items-center z-20">
          <Spinner size={20} className="text-gray-600" />
        </div>
      )}
        {/* Subtle gradient overlay */}
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-200`} />
        
        {/* Top accent border */}
        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-200`} />
        
        <CardHeader className="relative flex-row items-center justify-between pb-3">
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
            <Link href={`/courses/${id}`} className="block truncate max-w-full">{name}</Link>
          </CardTitle>
          {color ? (
            <div 
              className="w-5 h-5 rounded-full shadow-sm border-2 border-white dark:border-gray-700 flex-shrink-0" 
              style={{ backgroundColor: color }} 
            />
          ) : (
            <div className={`w-5 h-5 rounded-full bg-gradient-to-r ${gradient} shadow-sm border-2 border-white dark:border-gray-700 flex-shrink-0`} />
          )}
          
        </CardHeader>
        
        <CardContent className="relative pt-0">
          <div className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors mb-4">
            {[code, term].filter(Boolean).join(" • ") || "No additional info"}
          </div>
          
          {/* Hover indicator */}
          <Link href={`/courses/${id}`} className="flex items-center justify-between">
            <div className="text-xs text-gray-500 dark:text-gray-400">Click to view</div>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </div>
          </Link>

          {/* Delete button - bottom right */}
          <div className="absolute right-3 bottom-3 z-10">
            <DeleteCourseConfirmation
              courseName={name}
              onConfirm={async () => {
                try {
                  await del.mutateAsync(id);
                  handleSuccess("Course deleted successfully!", { operation: "delete_course", resourceId: id });
                } catch (error) {
                  handleError(error instanceof Error ? error : new Error("Failed to delete course"), {
                    operation: "delete_course",
                    resourceId: id
                  });
                }
              }}
            >
              <button
                className="p-2 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                title="Delete course"
                disabled={del.isPending}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m2 0H7m3-3h4a2 2 0 012 2v1H8V6a2 2 0 012-2z"/></svg>
              </button>
            </DeleteCourseConfirmation>
          </div>
        </CardContent>
      </Card>
  );
}

export default CourseCard;


