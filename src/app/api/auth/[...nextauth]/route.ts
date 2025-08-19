export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(...args: any) {
  const { getAuth } = await import("../../../../lib/auth");
  const { handler } = await getAuth();
  // @ts-ignore
  return handler(...args);
}

export async function POST(...args: any) {
  const { getAuth } = await import("../../../../lib/auth");
  const { handler } = await getAuth();
  // @ts-ignore
  return handler(...args);
}


