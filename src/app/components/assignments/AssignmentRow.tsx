"use client";
import { AssignmentDTO } from "@/interfaces/assignment";
import { useUpdateAssignment } from "@/app/hooks/useAssignments";
import { formatDate } from "@/lib/date";
import { Button } from "@components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/ui/select";
import { StatusPill, statusMeta } from "@components/ui/status";
import Link from "next/link";

export function AssignmentRow({ a }: { a: AssignmentDTO }) {
  const update = useUpdateAssignment();
  
  // centralized in StatusPill

  return (
    <div className="group relative p-4 rounded-lg bg-white dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:shadow-md transition-all duration-200">
      {/* Left accent border */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 to-purple-400 rounded-l-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
      
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <Link 
            href={`/assignments/${a.id}`}
            className="block group/title"
          >
            <div className="font-semibold text-gray-900 dark:text-white group-hover/title:text-blue-600 dark:group-hover/title:text-blue-400 transition-colors mb-2 line-clamp-2 leading-tight">
              {a.title}
            </div>
          </Link>
          <div className="flex flex-col gap-1 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="truncate">
                {a.dueAt ? formatDate(a.dueAt) : "No due date"}
              </span>
            </div>
            {a.estimatedHours && (
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="truncate">
                  Estimated: {a.estimatedHours}h
                </span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0">
          <Select
            value={a.status}
            onValueChange={(value) => update.mutate({ id: a.id, patch: { status: value as any } })}
          >
            <SelectTrigger className="h-8 w-auto px-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
              <SelectValue>
                <StatusPill status={a.status as any} size="sm" />
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NOT_SUBMITTED">
                <span className="inline-flex items-center gap-2"><span className={`w-2 h-2 rounded-full ${statusMeta.NOT_SUBMITTED.dot}`} />Not submitted</span>
              </SelectItem>
              <SelectItem value="SUBMITTED">
                <span className="inline-flex items-center gap-2"><span className={`w-2 h-2 rounded-full ${statusMeta.SUBMITTED.dot}`} />Submitted, waiting for grade</span>
              </SelectItem>
              <SelectItem value="GRADED">
                <span className="inline-flex items-center gap-2"><span className={`w-2 h-2 rounded-full ${statusMeta.GRADED.dot}`} />Submitted and graded</span>
              </SelectItem>
            </SelectContent>
          </Select>
          
          <Link 
            href={`/assignments/${a.id}`}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors flex-shrink-0"
            title="View details"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default AssignmentRow;


