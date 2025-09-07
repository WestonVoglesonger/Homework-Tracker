import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { adminInterface } from "@/interfaces/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ isAdmin: false });
    }

    const isAdmin = await adminInterface.isUserAdmin(session.user.id);

    return NextResponse.json({ isAdmin });
  } catch {
    return NextResponse.json({ isAdmin: false });
  }
}
