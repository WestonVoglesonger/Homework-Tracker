"use client";
import { Button } from "@components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { toast } from "sonner";

export default function DangerZone() {
  async function purge() {
    if (!confirm("Delete ALL courses and assignments? This cannot be undone.")) return;
    const res = await fetch("/api/admin/purge", { method: "POST" });
    if (res.ok) {
      toast.success("Deleted all courses and assignments");
      // Notify other components to refresh
      try { window.dispatchEvent(new Event("purge:done")); } catch {}
    } else {
      toast.error("Failed to delete");
    }
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>Danger zone</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">This will delete all of your courses and assignments. This cannot be undone.</p>
          <Button variant="destructive" onClick={purge}>Delete all data</Button>
        </div>
      </CardContent>
    </Card>
  );
}


