export interface CourseDTO {
  id: string;
  name: string;
  code?: string;
  term?: string;
  color?: string;
  source: "manual" | "canvas";
  canvasId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCourseInput {
  name: string;
  code?: string;
  term?: string;
  color?: string;
}


