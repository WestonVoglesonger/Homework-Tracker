import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: { signIn: "/auth/signin" },
  callbacks: {
    authorized: ({ token }) => {
      // Only allow if a valid JWT exists
      return Boolean(token?.sub);
    },
  },
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/courses/:path*",
    "/calendar/:path*",
    "/settings/:path*",
    "/admin/:path*",
    "/assignments/:path*",
  ],
};

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { getCSPHeaders, isValidOrigin } from "@/lib/security";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isApiRoute = pathname.startsWith("/api/");

  // Add security headers to non-API responses only
  const response = NextResponse.next();
  if (!isApiRoute) {
    const securityHeaders = getCSPHeaders();
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
  }

  // Add no-cache headers for authentication-related routes
  if (pathname.startsWith("/api/auth/") || pathname.startsWith("/api/register") ||
      pathname.startsWith("/api/auth/password/")) {
    response.headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
  }

  // Validate origin for API requests
  if (isApiRoute && req.method !== "GET") {
    if (!isValidOrigin(req)) {
      return NextResponse.json({ error: "Invalid origin" }, { status: 400 });
    }
  }

  // Admin routes require special handling
  if (pathname.startsWith("/admin")) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = "/auth/signin";
      url.searchParams.set("from", pathname);
      return NextResponse.redirect(url);
    }
    return response;
  }

  // Public paths (accessible to everyone)
  const publicPaths = ["/", "/auth/signin", "/auth/register", "/auth/waitlist", "/privacy", "/terms", "/api/auth", "/api/user-limit"];
  if (publicPaths.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return response;
  }

  // Use NextAuth JWT token to validate authentication
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.set("from", pathname);
    const response = NextResponse.redirect(url);
    // Store intended destination for Canvas setup later
    response.cookies.set('canvasSetupRedirect', pathname, {
      path: '/',
      maxAge: 60 * 60, // 1 hour
      httpOnly: false // Allow client-side access
    });
    return response;
  }

  // Check if user is waitlisted and restrict access
  try {
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();

    const user = await prisma.user.findUnique({
      where: { id: token.sub },
      select: { isWaitlisted: true, isAdmin: true },
    });

    await prisma.$disconnect();

    // If user is waitlisted (and not admin), allow only landing page and settings
    if (user?.isWaitlisted && !user?.isAdmin) {
      const allowedWhileWaitlisted = ["/", "/settings"];
      const isAllowed = allowedWhileWaitlisted.some(
        (p) => pathname === p || pathname.startsWith(p + "/")
      );
      if (!isAllowed) {
        const url = req.nextUrl.clone();
        url.pathname = "/";
        return NextResponse.redirect(url);
      }
    }
  } catch (error) {
    console.error("Error checking user waitlist status:", error);
    // If error occurs, allow access to be safe
  }

  return response;
}
