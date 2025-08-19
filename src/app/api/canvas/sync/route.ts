import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // Verify this is an authorized request (e.g., from a cron job)
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  try {
    const { default: prisma } = await import("../../../../db/client");
    const { canvasService } = await import("../../../../services/canvasService");
    const { courseService } = await import("../../../../services/courseService");
    const { assignmentService } = await import("../../../../services/assignmentService");

    // Get all users with Canvas connections
    const canvasAccounts = await prisma.account.findMany({
      where: { 
        provider: "canvas",
        access_token: { not: null }
      },
      include: { user: true }
    });
    
    const results = {
      users: 0,
      courses: 0,
      assignments: 0,
      errors: [] as string[]
    };
    
    for (const account of canvasAccounts) {
      if (!account.access_token) continue;
      
      try {
        results.users++;
        
        // Fetch Canvas courses
        const canvasCourses = await canvasService.listCanvasCourses(account.access_token);
        
        for (const canvasCourse of canvasCourses) {
          try {
            // Upsert course
            await courseService.upsert(account.userId, {
              name: canvasCourse.name,
              code: canvasCourse.code,
              term: canvasCourse.term,
              source: "canvas",
              canvasId: canvasCourse.canvasId!
            });
            results.courses++;
            
            // Fetch assignments for this course
            const canvasAssignments = await canvasService.listCanvasAssignments(
              account.access_token,
              canvasCourse.canvasId!
            );
            
            // Get the local course ID
            const localCourse = await prisma.course.findUnique({
              where: {
                userId_canvasId: {
                  userId: account.userId,
                  canvasId: canvasCourse.canvasId!
                }
              }
            });
            
            if (!localCourse) continue;
            
            // Upsert assignments
            for (const canvasAssignment of canvasAssignments) {
              try {
                // Check if assignment already exists
                const existing = await prisma.assignment.findUnique({
                  where: {
                    userId_canvasId: {
                      userId: account.userId,
                      canvasId: canvasAssignment.canvasId!
                    }
                  }
                });
                
                if (existing) {
                  // Update existing assignment (but don't override status or notes)
                  await prisma.assignment.update({
                    where: { id: existing.id },
                    data: {
                      title: canvasAssignment.title,
                      description: canvasAssignment.description,
                      dueAt: canvasAssignment.dueAt ? new Date(canvasAssignment.dueAt) : null,
                      canvasUrl: canvasAssignment.canvasUrl,
                    }
                  });
                } else {
                  // Create new assignment
                  await assignmentService.create(account.userId, {
                    courseId: localCourse.id,
                    title: canvasAssignment.title,
                    description: canvasAssignment.description,
                    type: canvasAssignment.type as any,
                    dueAt: canvasAssignment.dueAt,
                    source: "canvas",
                    canvasId: canvasAssignment.canvasId,
                    canvasUrl: canvasAssignment.canvasUrl,
                  });
                }
                results.assignments++;
              } catch (error) {
                console.error(`Failed to sync assignment ${canvasAssignment.title}:`, error);
              }
            }
          } catch (error) {
            console.error(`Failed to sync course ${canvasCourse.name}:`, error);
            results.errors.push(`Course ${canvasCourse.name}: ${error}`);
          }
        }
      } catch (error) {
        console.error(`Failed to sync for user ${account.user.email}:`, error);
        results.errors.push(`User ${account.user.email}: ${error}`);
      }
    }
    
    return NextResponse.json({
      success: true,
      results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Canvas sync failed:", error);
    return NextResponse.json({ 
      error: "Sync failed", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}
