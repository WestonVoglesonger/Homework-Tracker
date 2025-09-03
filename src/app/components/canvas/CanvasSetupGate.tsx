"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { CanvasSetupWizard } from "@/app/components/canvas/CanvasSetupWizard";

export function CanvasSetupGate() {
  const { status } = useSession();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const check = async () => {
    setLoading(true);
    try {
      const [prefsRes, canvasRes] = await Promise.all([
        fetch("/api/user/preferences", { cache: "no-store" }),
        fetch("/api/canvas/courses", { cache: "no-store" }),
      ]);

      const prefs = prefsRes.ok ? await prefsRes.json() : { canvasSetupDismissed: false };
      const canvasConnected = canvasRes.ok;

      if (!canvasConnected && !prefs.canvasSetupDismissed) {
        setOpen(true);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      check();
    }
  }, [status]);

  if (loading) return null;

  return (
    <CanvasSetupWizard
      isOpen={open}
      onClose={() => setOpen(false)}
      onSuccess={() => setOpen(false)}
    />
  );
}


