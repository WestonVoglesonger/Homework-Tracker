import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const base = process.env.CANVAS_BASE_URL;
  const clientId = process.env.CANVAS_CLIENT_ID;
  const redirect = process.env.CANVAS_REDIRECT_URL;
  if (!base || !clientId || !redirect) {
    return NextResponse.json({ error: "Canvas not configured" }, { status: 500 });
  }
  const url = new URL("/login/oauth2/auth", base);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", redirect);
  url.searchParams.set("scope", "url:GET|/api/v1/courses url:GET|/api/v1/courses/:id/assignments");
  return NextResponse.redirect(url);
}


