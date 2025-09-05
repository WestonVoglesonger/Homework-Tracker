import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getAuth } from "@/lib/auth";
import { rateLimit } from "@/lib/security";
import { z } from "zod";
import { getAdminService, getAuthenticationService, getAnalyticsService, getErrorLogService } from "@/services/container/ServiceContainer";
import { default as prisma } from "@/db/client";

const promoteAdminSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  adminPassword: z.string().min(1),
});

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let session: any = null;

  try {
    // Rate limiting
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
              req.headers.get("x-real-ip") || "unknown";
    const rateLimitOk = await rateLimit(`admin-promote:${ip}`);
    if (!rateLimitOk) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    // Get current session
    const { authOptions } = await getAuth();
    session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await req.json();
    const parsed = promoteAdminSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({
        error: parsed.error.issues[0]?.message || "Invalid input"
      }, { status: 400 });
    }

    const { email, password, adminPassword } = parsed.data;
    const authService = getAuthenticationService(prisma);

    // Verify user credentials and find user
    const user = await authService.findUserByEmail(email);

    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify password
    const { compare } = await import("bcryptjs");
    const validPassword = await compare(password, user.passwordHash);

    if (!validPassword) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Check if user is trying to promote themselves
    if (session.user.id !== user.id) {
      return NextResponse.json({
        error: "You can only promote your own account"
      }, { status: 403 });
    }

    // Promote to admin
    const adminService = getAdminService(prisma);
    const updatedUser = await adminService.promoteToAdmin(user.id, adminPassword, session.user.id);

    // Track the event
    const analyticsService = getAnalyticsService(prisma);
    await analyticsService.trackUserActivity(session.user.id, "API: POST /api/admin/auth/promote");

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        isAdmin: updatedUser.isAdmin,
      },
    });

  } catch (error) {
    console.error("Admin promotion error:", error);
    // Log the error using OOP service
    const errorLogService = getErrorLogService(prisma);
    await errorLogService.logApiError("/api/admin/auth/promote", "POST", error as Error, session?.user?.id);

    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);

      if (error.message.includes("Invalid admin password")) {
        return NextResponse.json({ error: "Invalid admin password" }, { status: 401 });
      }
      if (error.message.includes("Admin password not configured")) {
        return NextResponse.json({ error: "System configuration error" }, { status: 500 });
      }
    }

    return NextResponse.json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
