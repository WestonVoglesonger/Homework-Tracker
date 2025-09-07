import { auth } from "@/lib/auth";
import { getCSPHeaders, isValidOrigin } from "@/lib/security";

export default auth(async (req) => {
  const { pathname } = req.nextUrl;
  const isApiRoute = pathname.startsWith("/api/");

  // Add security headers to non-API responses only
  if (!isApiRoute) {
    const response = new Response(null, { status: 200 });
    const securityHeaders = getCSPHeaders();
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
  }

  // Add no-cache headers for authentication-related routes
  if (pathname.startsWith("/api/auth/") || pathname.startsWith("/api/register") ||
      pathname.startsWith("/api/auth/password/")) {
    const response = new Response(null, { status: 200 });
    response.headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
  }

  // Validate origin for API requests
  if (isApiRoute && req.method !== "GET") {
    if (!isValidOrigin(req)) {
      return new Response(JSON.stringify({ error: "Invalid origin" }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // Admin routes require special handling
  if (pathname.startsWith("/admin")) {
    if (!req.auth) {
      const url = req.nextUrl.clone();
      url.pathname = "/auth/signin";
      url.searchParams.set("from", pathname);
      return Response.redirect(url);
    }
  }

  // Public paths (accessible to everyone)
  const publicPaths = ["/", "/auth/signin", "/auth/register", "/auth/waitlist", "/privacy", "/terms", "/api/auth", "/api/user-limit"];
  if (publicPaths.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return;
  }

  // Check authentication
  if (!req.auth) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.set("from", pathname);
    const response = new Response(null, {
      status: 302,
      headers: {
        'Location': url.toString(),
        'Set-Cookie': `canvasSetupRedirect=${pathname}; Path=/; Max-Age=${60 * 60}; HttpOnly=false`
      }
    });
    return response;
  }

  // Check if user is waitlisted and restrict access
  if (req.auth?.user?.id) {
    try {
      const { PrismaClient } = await import("@prisma/client");
      const prisma = new PrismaClient();

      const user = await prisma.user.findUnique({
        where: { id: req.auth.user!.id },
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
          return Response.redirect(url);
        }
      }
    } catch (error) {
      console.error("Error checking user waitlist status:", error);
      // If error occurs, allow access to be safe
    }
  }
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

// All middleware logic is now handled by the auth() function above
