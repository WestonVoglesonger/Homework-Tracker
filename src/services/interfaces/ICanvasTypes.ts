/**
 * Canvas API Data Types
 * Defines interfaces for Canvas LMS API responses
 */

export interface CanvasCourse {
  id: number;
  name: string;
  course_code: string;
  term?: {
    name: string;
  };
  start_at?: string;
  end_at?: string;
}

export interface CanvasAssignment {
  id: number;
  name: string;
  description?: string;
  due_at?: string;
  course_id: number;
  html_url?: string;
  points_possible?: number;
  submission_types?: string[];
  workflow_state: "published" | "unpublished" | "deleted";
}

export interface CanvasSubmission {
  id: number;
  assignment_id: number;
  user_id: number;
  submission_type?: string;
  workflow_state: "submitted" | "unsubmitted" | "graded" | "pending_review";
  grade?: string;
  graded_at?: string;
  submitted_at?: string;
}

export interface CanvasTokenInfo {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
}
