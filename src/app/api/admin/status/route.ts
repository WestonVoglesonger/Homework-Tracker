import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getAuth } from "@/lib/auth";
import { adminInterface } from "@/interfaces/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { authOptions } = await getAuth();
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ isAdmin: false });
    }

    const isAdmin = await adminInterface.isUserAdmin(session.user.id);

    return NextResponse.json({ isAdmin });
  } catch {
    return NextResponse.json({ isAdmin: false });
  }
}
