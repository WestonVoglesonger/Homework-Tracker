export interface CanvasCourse {
  id: number;
  name: string;
  course_code?: string;
  term?: { name?: string } | null;
}

export interface CanvasAssignment {
  id: number;
  name: string;
  due_at?: string | null;
  description?: string | null;
  html_url?: string | null;
  points_possible?: number | null;
  // When requested with include[]=submission&student_ids[]=self
  submission?: {
    workflow_state?: string | null; // e.g., "submitted", "graded", etc.
  } | null;
}


