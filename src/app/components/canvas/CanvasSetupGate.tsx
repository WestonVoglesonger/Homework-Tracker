"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { CanvasSetupWizard } from "@/app/components/canvas/CanvasSetupWizard";

export function CanvasSetupGate() {
  const { status } = useSession();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const check = useCallback(async () => {
    setLoading(true);
    try {
      const [prefsRes, canvasRes] = await Promise.all([
        fetch("/api/user/preferences", { cache: "no-store" }),
        fetch("/api/canvas/courses", { cache: "no-store" }),
      ]);

      const prefs = prefsRes.ok ? await prefsRes.json() : { canvasSetupDismissed: false };
      const canvasConnected = canvasRes.ok;

      if (!canvasConnected && !prefs.canvasSetupDismissed) {
        // Store current location for redirect after setup
        if (pathname && pathname !== '/' && !pathname.startsWith('/auth/')) {
          localStorage.setItem('canvasSetupRedirect', pathname);
        }
        setOpen(true);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [pathname]);

  useEffect(() => {
    if (status === "authenticated") {
      check();
    }
  }, [status, pathname, check]);

  if (loading) return null;

  return (
    <CanvasSetupWizard
      isOpen={open}
      onClose={() => setOpen(false)}
      onSuccess={() => setOpen(false)}
    />
  );
}


