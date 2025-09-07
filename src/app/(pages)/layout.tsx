"use client";

import { ProtectedRoute } from "@/app/components/auth/RouteGuard";
import { usePathname } from "next/navigation";

export default function PagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAuthPath = pathname?.startsWith("/auth");

  if (isAuthPath) {
    return <>{children}</>;
  }

  return <ProtectedRoute>{children}</ProtectedRoute>;
}
