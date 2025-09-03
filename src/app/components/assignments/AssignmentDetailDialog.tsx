"use client";
import { AssignmentDTO } from "@/interfaces/assignment";
import { CourseDTO } from "@/interfaces/course";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@components/ui/dialog";
import { Badge } from "@components/ui/badge";
import { format, parseISO, isPast } from "date-fns";
import { Calendar, Clock, BookOpen, ExternalLink, FileText, AlertCircle, CheckCircle } from "lucide-react";

interface AssignmentDetailDialogProps {
  assignment: AssignmentDTO | null;
  course?: CourseDTO | null;
  isOpen: boolean;
  onClose: () => void;
}

export function AssignmentDetailDialog({ assignment, course, isOpen, onClose }: AssignmentDetailDialogProps) {
  if (!assignment) return null;

  let isOverdue: boolean = false;
  let shouldShowRed: boolean = false;

  try {
    if (assignment.dueAt) {
      isOverdue = isPast(parseISO(assignment.dueAt));
      // Only show red if overdue AND not submitted/graded
      shouldShowRed = isOverdue && assignment.status === "NOT_SUBMITTED";
    }
  } catch (error) {
    // Error parsing due date - using default value
    isOverdue = false;
    shouldShowRed = false;
  }

  const getStatusColor = (status: AssignmentDTO["status"]): string => {
    switch (status) {
      case "NOT_SUBMITTED":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "SUBMITTED":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "GRADED":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    }
  };



  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FileText className="h-5 w-5" />
            {assignment.title}
          </DialogTitle>
          <DialogDescription>
            View detailed information about this assignment including due dates, course details, and status.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Badges */}
          <div className="flex flex-wrap gap-2">
            <Badge className={getStatusColor(assignment.status)}>
              {assignment.status.replace("_", " ")}
            </Badge>
            {assignment.source === "canvas" && (
              <Badge variant="outline" className="border-blue-200 text-blue-700 dark:border-blue-800 dark:text-blue-300">
                Canvas
              </Badge>
            )}
            {isOverdue && assignment.status === "NOT_SUBMITTED" && (
              <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                <AlertCircle className="h-3 w-3 mr-1" />
                Overdue
              </Badge>
            )}
          </div>

          {/* Course Information */}
          {course && (
            <div className="flex items-center gap-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <BookOpen className="h-4 w-4 text-gray-500" />
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {course.name}
                </div>
                {course.code && (
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {course.code}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Due Date */}
          {assignment.dueAt && (
            <div className="flex items-center gap-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Calendar className={`h-4 w-4 ${shouldShowRed ? 'text-red-500' : 'text-gray-500'}`} />
              <div>
                <div className={`font-medium ${shouldShowRed ? 'text-red-700 dark:text-red-300' : 'text-gray-900 dark:text-white'}`}>
                  Due: {(() => {
                    try {
                      return format(parseISO(assignment.dueAt), "EEEE, MMMM d, yyyy");
                    } catch (error) {
                      return assignment.dueAt;
                    }
                  })()}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {(() => {
                    try {
                      return format(parseISO(assignment.dueAt), "h:mm a");
                    } catch (error) {
                      return '';
                    }
                  })()}
                </div>
                {isOverdue && assignment.status === "NOT_SUBMITTED" && (
                  <div className="text-xs text-red-600 dark:text-red-400 mt-1 font-medium">
                    Past due - please submit as soon as possible
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Estimated Hours */}
          {assignment.estimatedHours && (
            <div className="flex items-center gap-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Clock className="h-4 w-4 text-gray-500" />
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  Estimated Time: {assignment.estimatedHours} hours
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          {assignment.description && (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Description</h3>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div
                  className="text-gray-700 dark:text-gray-300 [&>*]:mb-4 [&>p]:mb-2 [&>p]:leading-relaxed [&>ul]:ml-4 [&>ol]:ml-4 [&>li]:mb-1"
                  dangerouslySetInnerHTML={{ __html: assignment.description }}
                />
              </div>
            </div>
          )}

          {/* Notes */}
          {assignment.notes && (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Notes</h3>
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div
                  className="text-blue-800 dark:text-blue-200 [&>*]:mb-4 [&>p]:mb-2 [&>p]:leading-relaxed [&>ul]:ml-4 [&>ol]:ml-4 [&>li]:mb-1"
                  dangerouslySetInnerHTML={{ __html: assignment.notes }}
                />
              </div>
            </div>
          )}

          {/* Canvas Link */}
          {assignment.canvasUrl && (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Canvas Link</h3>
              <a
                href={assignment.canvasUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-800 dark:text-blue-200 rounded-lg transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                View in Canvas
              </a>
            </div>
          )}

          {/* Metadata */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Last Updated: {(() => {
                try {
                  return format(parseISO(assignment.updatedAt), "MMM d, yyyy 'at' h:mm a");
                } catch (error) {
                  return assignment.updatedAt;
                }
              })()}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
