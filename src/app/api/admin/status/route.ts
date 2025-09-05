import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getAuth } from "@/lib/auth";
import { getAdminService } from "@/services/container/ServiceContainer";
import { default as prisma } from "@/db/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { authOptions } = await getAuth();
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ isAdmin: false });
    }

    const adminService = getAdminService(prisma);
    const isAdmin = await adminService.isAdmin(session.user.id);

    return NextResponse.json({ isAdmin });
  } catch (error) {
    return NextResponse.json({ isAdmin: false });
  }
}
