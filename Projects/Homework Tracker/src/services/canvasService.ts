import { CanvasAssignment, CanvasCourse } from "../interfaces/canvas";
import prisma from "../db/client";

const CANVAS_BASE_URL = process.env.CANVAS_BASE_URL || "";

export async function fetchCanvas<T>(
  path: string,
  accessToken: string,
  query?: Record<string, string | number | boolean | undefined>
): Promise<T> {
  const url = new URL(`/api/v1${path}`, CANVAS_BASE_URL);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined) url.searchParams.set(k, String(v));
    }
  }
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Canvas error ${res.status}`);
  }
  return (await res.json()) as T;
}

export function mapCanvasCourseToDTO(c: CanvasCourse) {
  return {
    id: String(c.id),
    name: c.name,
    code: c.course_code,
    term: c.term?.name,
    color: undefined,
    source: "canvas" as const,
    canvasId: String(c.id),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function mapCanvasAssignmentToDTO(a: CanvasAssignment, courseId?: string) {
  return {
    id: String(a.id),
    courseId,
    title: a.name,
    description: a.description ?? undefined,
    type: "OTHER" as const,
    dueAt: a.due_at ?? undefined,
    estimatedHours: undefined,
    status: "TODO" as const,
    priority: 0,
    notes: undefined,
    source: "canvas" as const,
    canvasId: String(a.id),
    canvasUrl: a.html_url ?? undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export async function listCanvasCourses(accessToken: string) {
  const items = await fetchCanvas<CanvasCourse[]>("/courses", accessToken, {
    enrollment_state: "active",
    per_page: 100,
  });
  return items.map(mapCanvasCourseToDTO);
}

export async function listCanvasAssignments(accessToken: string, courseId: string) {
  const items = await fetchCanvas<CanvasAssignment[]>(`/courses/${courseId}/assignments`, accessToken, {
    per_page: 100,
  });
  return items.map((a) => mapCanvasAssignmentToDTO(a, courseId));
}

export const canvasService = {
  listCanvasCourses,
  listCanvasAssignments,
};

export async function getAccessTokenForUser(userId: string) {
  const account = await prisma.account.findFirst({ where: { userId, provider: "canvas" } });
  return account?.access_token ?? null;
}

export async function exchangeCodeForToken(code: string) {
  const base = process.env.CANVAS_BASE_URL || "";
  const clientId = process.env.CANVAS_CLIENT_ID || "";
  const clientSecret = process.env.CANVAS_CLIENT_SECRET || "";
  const redirect = process.env.CANVAS_REDIRECT_URL || "";
  const tokenRes = await fetch(new URL("/login/oauth2/token", base).toString(), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirect,
      code,
    }),
  });
  if (!tokenRes.ok) throw new Error("Token exchange failed");
  return (await tokenRes.json()) as { access_token: string; refresh_token?: string; expires_in?: number; token_type?: string; scope?: string };
}

export async function upsertCanvasAccount(userId: string, tokenJson: { access_token: string; refresh_token?: string; expires_in?: number; token_type?: string; scope?: string }) {
  await prisma.account.upsert({
    where: { provider_providerAccountId: { provider: "canvas", providerAccountId: userId } },
    create: {
      userId,
      provider: "canvas",
      type: "oauth",
      providerAccountId: userId,
      access_token: tokenJson.access_token,
      refresh_token: tokenJson.refresh_token,
      token_type: tokenJson.token_type,
      scope: tokenJson.scope,
      expires_at: tokenJson.expires_in ? Math.floor(Date.now() / 1000) + tokenJson.expires_in : null,
    },
    update: {
      access_token: tokenJson.access_token,
      refresh_token: tokenJson.refresh_token,
      token_type: tokenJson.token_type,
      scope: tokenJson.scope,
      expires_at: tokenJson.expires_in ? Math.floor(Date.now() / 1000) + tokenJson.expires_in : null,
    },
  });
}

export async function deleteCanvasAccount(userId: string) {
  await prisma.account.deleteMany({ where: { userId, provider: "canvas" } });
}

export const canvasTokenService = { getAccessTokenForUser, exchangeCodeForToken, upsertCanvasAccount, deleteCanvasAccount };


