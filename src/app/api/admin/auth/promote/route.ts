import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getAuth } from "@/lib/auth";
import { adminInterface } from "@/interfaces/admin";
import { userInterface } from "@/interfaces/user";
import { analyticsInterface } from "@/interfaces/analyticsInterface";
import { errorLogInterface } from "@/interfaces/errorLogInterface";
import { rateLimit } from "@/lib/security";
import { z } from "zod";

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
    
    // Do not hard-reject when there's no session. We'll rely on provided
    // email/password to prove identity for self-promotion path.

    // Parse request body
    const body = await req.json();
    const parsed = promoteAdminSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ 
        error: parsed.error.issues[0]?.message || "Invalid input" 
      }, { status: 400 });
    }

    const { email, password, adminPassword } = parsed.data;

    // Verify user credentials (case-insensitive email)
    const user = await userInterface.findByEmail(email);
    
    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify password
    const { compare } = await import("bcryptjs");
    // Defensive trims to avoid accidental whitespace issues from input fields
    const validPassword = await compare(password.trim(), user.passwordHash);
    
    if (!validPassword) {
      return NextResponse.json({ error: "Invalid account credentials" }, { status: 401 });
    }

    // Determine current user id: prefer session, fallback to verified account
    const currentUserId = session?.user?.id || user.id;
    // If session exists and does not match supplied account, block
    if (session?.user?.id && session.user.id !== user.id) {
      return NextResponse.json({ 
        error: "You can only promote your own account" 
      }, { status: 403 });
    }

    // Promote to admin
    const updatedUser = await adminInterface.promoteUserToAdmin(
      currentUserId,
      user.id,
      adminPassword.trim()
    );

    // Track the event
    await analyticsInterface.trackEvent({
      event: "api_call",
      data: { endpoint: "/api/admin/auth/promote", method: "POST" },
      userId: session.user.id,
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || undefined,
      userAgent: req.headers.get("user-agent") || undefined,
    });

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
    // Log the error
    await errorLogInterface.createErrorLog({
      level: "ERROR",
      message: (error as Error).message,
      stack: (error as Error).stack,
      context: {
        userId: session?.user?.id,
        endpoint: req.nextUrl.pathname,
        method: req.method,
        userAgent: req.headers.get("user-agent") || undefined,
        ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || undefined,
        additionalData: { adminOperation: true },
      },
    }, session?.user?.id);
    
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
