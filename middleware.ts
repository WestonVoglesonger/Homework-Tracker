import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { getCSPHeaders, isValidOrigin } from "@/lib/security";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // Add security headers to all responses
  const response = NextResponse.next();
  const securityHeaders = getCSPHeaders();
  
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Validate origin for API requests
  if (pathname.startsWith("/api/") && req.method !== "GET") {
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

  // Public paths
  const publicPaths = ["/", "/auth/signin", "/auth/register", "/api/auth", "/api/canvas/oauth"];
  if (publicPaths.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return response;
  }

  // Use NextAuth JWT token to validate authentication
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }
  
  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/courses/:path*", "/calendar/:path*", "/settings/:path*", "/admin/:path*", "/api/:path*"],
};



