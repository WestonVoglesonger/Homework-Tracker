"use client";

import { PublicOnlyGuard } from "@/app/components/auth/AuthGuard";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Re-enable public-only guard now that pages render correctly
  return <PublicOnlyGuard>{children}</PublicOnlyGuard>;
}
