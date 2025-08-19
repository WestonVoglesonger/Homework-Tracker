"use client";
import AppShell from "../../../components/layout/AppShell";
import { useCanvasImport } from "../../../hooks/useCanvasImport";
import { useEffect, useState } from "react";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import CanvasImportPanel from "../../../components/canvas/CanvasImportPanel";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { toast } from "sonner";

export default function SettingsPage() {
  const { startOAuth, listCanvasCourses } = useCanvasImport();
  const [connected, setConnected] = useState<boolean>(false);
  const [pat, setPat] = useState("");
  useEffect(() => {
    listCanvasCourses()
      .then((d) => setConnected(Array.isArray(d)))
      .catch(() => setConnected(false));
  }, []);
  return (
    <AppShell>
      <h1 className="text-2xl font-semibold mb-4">Settings</h1>
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Canvas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground mb-3">Status: {connected ? "Connected" : "Not Connected"}</div>
            <Button onClick={() => startOAuth()}>{connected ? "Reconnect" : "Connect"}</Button>
            <div className="mt-4 grid gap-2">
              <Label>Or paste a Canvas Personal Access Token</Label>
              <div className="flex gap-2">
                <Input placeholder="Canvas Access Token" value={pat} onChange={(e) => setPat(e.target.value)} />
                <Button
                  variant="secondary"
                  onClick={async () => {
                    const res = await fetch("/api/canvas/token", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ accessToken: pat.trim() }),
                    });
                    if (res.ok) {
                      toast.success("Canvas token saved");
                      setConnected(true);
                      setPat("");
                    } else {
                      toast.error("Failed to save token");
                    }
                  }}
                  disabled={!pat.trim()}
                >
                  Save Token
                </Button>
                {connected && (
                  <Button
                    variant="destructive"
                    onClick={async () => {
                      const res = await fetch("/api/canvas/token", { method: "DELETE" });
                      if (res.ok) {
                        toast.success("Disconnected Canvas");
                        setConnected(false);
                      }
                    }}
                  >
                    Disconnect
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        {connected && <CanvasImportPanel />}
      </div>
    </AppShell>
  );
}


