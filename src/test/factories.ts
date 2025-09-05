import { PrismaClient, User, Course, Assignment } from "@prisma/client";
import { hash } from "bcryptjs";
import { testDb } from "./db-setup";

export interface TestUser extends User {
  plainPassword?: string;
}

export interface TestUserInput {
  email?: string;
  name?: string;
  password?: string;
  emailVerified?: Date | null;
  isAdmin?: boolean;
  canvasSetupDismissed?: boolean;
}

export interface TestCourseInput {
  name?: string;
  code?: string;
  term?: string;
  color?: string;
  source?: string;
  canvasId?: string;
}

export interface TestAssignmentInput {
  title?: string;
  description?: string;
  type?: "HOMEWORK" | "QUIZ" | "EXAM" | "PROJECT" | "OTHER";
  dueAt?: Date | null;
  estimatedHours?: number | null;
  status?: "NOT_SUBMITTED" | "SUBMITTED" | "GRADED";
  priority?: number;
  notes?: string | null;
  source?: string;
  canvasId?: string | null;
  canvasUrl?: string | null;
}

export class TestDataFactory {
  private db: PrismaClient;
  private userCounter = 0;
  private courseCounter = 0;
  private assignmentCounter = 0;

  constructor(database?: PrismaClient) {
    this.db = database || testDb!;
  }

  async createUser(input: TestUserInput = {}): Promise<TestUser> {
    this.userCounter++;
    
    const plainPassword = input.password || 'password123';
    const passwordHash = await hash(plainPassword, 10);
    
    const user = await this.db.user.create({
      data: {
        email: input.email || `test${this.userCounter}@example.com`,
        name: input.name || `Test User ${this.userCounter}`,
        passwordHash,
        emailVerified: input.emailVerified === undefined ? new Date() : input.emailVerified,
        isAdmin: input.isAdmin || false,
        canvasSetupDismissed: input.canvasSetupDismissed || false,
      },
    });

    return { ...user, plainPassword };
  }

  async createCourse(userId: string, input: TestCourseInput = {}): Promise<Course> {
    this.courseCounter++;
    
    return await this.db.course.create({
      data: {
        userId,
        name: input.name || `Test Course ${this.courseCounter}`,
        code: input.code || `CS${this.courseCounter}`,
        term: input.term || "Fall 2024",
        color: input.color || "#3B82F6",
        source: input.source || "manual",
        canvasId: input.canvasId || null,
      },
    });
  }

  async createAssignment(
    userId: string, 
    courseId?: string | null, 
    input: TestAssignmentInput = {}
  ): Promise<Assignment> {
    this.assignmentCounter++;
    
    return await this.db.assignment.create({
      data: {
        userId,
        courseId: courseId || null,
        title: input.title || `Test Assignment ${this.assignmentCounter}`,
        description: input.description || `Description for assignment ${this.assignmentCounter}`,
        type: input.type || "HOMEWORK",
        dueAt: input.dueAt === undefined ? 
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : // 1 week from now
          input.dueAt,
        estimatedHours: input.estimatedHours === undefined ? 2 : input.estimatedHours,
        status: input.status || "NOT_SUBMITTED",
        priority: input.priority || 0,
        notes: input.notes === undefined ? null : input.notes,
        source: input.source || "manual",
        canvasId: input.canvasId === undefined ? null : input.canvasId,
        canvasUrl: input.canvasUrl === undefined ? null : input.canvasUrl,
      },
    });
  }

  async createCompleteUserWithData(userInput?: TestUserInput) {
    const user = await this.createUser(userInput);
    
    // Create 2 courses
    const course1 = await this.createCourse(user.id, {
      name: "Mathematics 101",
      code: "MATH101",
      term: "Fall 2024"
    });
    
    const course2 = await this.createCourse(user.id, {
      name: "Computer Science 102", 
      code: "CS102",
      term: "Fall 2024"
    });

    // Create assignments with different statuses
    const assignments = await Promise.all([
      this.createAssignment(user.id, course1.id, {
        title: "Calculus Homework 1",
        status: "NOT_SUBMITTED",
        dueAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      }),
      this.createAssignment(user.id, course1.id, {
        title: "Calculus Quiz 1",
        type: "QUIZ",
        status: "SUBMITTED",
        dueAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      }),
      this.createAssignment(user.id, course2.id, {
        title: "Programming Project 1",
        type: "PROJECT",
        status: "GRADED",
        estimatedHours: 8,
        dueAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
      }),
      this.createAssignment(user.id, null, {
        title: "General Task",
        type: "OTHER",
        status: "NOT_SUBMITTED",
      })
    ]);

    return {
      user,
      courses: [course1, course2],
      assignments,
    };
  }

  // Canvas-specific test data
  async createCanvasCourse(userId: string, canvasId: string = "12345"): Promise<Course> {
    return await this.createCourse(userId, {
      name: "Canvas Imported Course",
      code: "CANVAS101",
      source: "canvas",
      canvasId,
    });
  }

  async createCanvasAssignment(
    userId: string,
    courseId: string,
    canvasId: string = "67890"
  ): Promise<Assignment> {
    return await this.createAssignment(userId, courseId, {
      title: "Canvas Assignment",
      description: "<p>This is a Canvas assignment with HTML description</p>",
      source: "canvas",
      canvasId,
      canvasUrl: `https://canvas.example.com/courses/${courseId}/assignments/${canvasId}`,
    });
  }

  // Admin test data
  async createAdminUser(input: TestUserInput = {}): Promise<TestUser> {
    return await this.createUser({
      ...input,
      isAdmin: true,
      name: input.name || "Admin User",
      email: input.email || "admin@example.com",
    });
  }

  // Performance test data - create bulk data
  async createBulkAssignments(userId: string, courseId: string, count: number = 10): Promise<Assignment[]> {
    const assignments: Promise<Assignment>[] = [];
    
    for (let i = 0; i < count; i++) {
      assignments.push(this.createAssignment(userId, courseId, {
        title: `Bulk Assignment ${i + 1}`,
        dueAt: new Date(Date.now() + i * 24 * 60 * 60 * 1000), // Stagger due dates
      }));
    }
    
    return Promise.all(assignments);
  }
}

// Singleton instance for convenience
export const testFactory = new TestDataFactory();
