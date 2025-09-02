export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(...args: any) {
  const { getAuth } = await import("../../../../lib/auth");
  const { handler } = await getAuth();
  // @ts-ignore
  const response = await handler(...args);
  // Ensure no caching for authentication responses
  response.headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  return response;
}

export async function POST(...args: any) {
  const { getAuth } = await import("../../../../lib/auth");
  const { handler } = await getAuth();
  // @ts-ignore
  const response = await handler(...args);
  // Ensure no caching for authentication responses
  response.headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  return response;
}


