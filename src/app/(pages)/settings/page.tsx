"use client";
import AppShell from "@components/layout/AppShell";
import { useCanvasImport } from "@/app/hooks/useCanvasImport";
import { useEffect, useState } from "react";
import { Button } from "@components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import CanvasImportPanel from "@components/canvas/CanvasImportPanel";
import DangerZone from "@components/settings/DangerZone";

import { toast } from "sonner";
import { CanvasSetupWizard } from "@/app/components/canvas/CanvasSetupWizard";
import { QuickCanvasSetup } from "@/app/components/canvas/QuickCanvasSetup";

export default function SettingsPage() {
  const { listCanvasCourses } = useCanvasImport();
  const [connected, setConnected] = useState<boolean>(false);
  const [showWizard, setShowWizard] = useState(false);
  const [highlightImport, setHighlightImport] = useState(false);
  useEffect(() => {
    listCanvasCourses()
      .then((d) => setConnected(Array.isArray(d)))
      .catch(() => setConnected(false));
  }, []);

  // Check for canvas-import URL parameter
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('canvas-import') === 'true') {
        setHighlightImport(true);
        // Clear the URL parameter
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);

        // Show a welcome message
        toast.success("Canvas connected! Choose which courses to import below.");
      }
    }
  }, []);

  const handleCanvasConnectionSuccess = () => {
    setConnected(true);
    // Refresh the connection status
    listCanvasCourses()
      .then((d) => setConnected(Array.isArray(d)))
      .catch(() => setConnected(false));
  };
  return (
    <AppShell>
      <h1 className="text-2xl font-semibold mb-4">Settings</h1>
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Canvas Integration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground mb-4">
              Status: <span className={connected ? "text-green-600" : "text-orange-600"}>
                {connected ? "Connected" : "Not Connected"}
              </span>
            </div>

            {connected ? (
              // Connected state - show disconnect option
              <div className="space-y-4">
                <div className="flex gap-2">
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
                    Disconnect Canvas
                  </Button>
                </div>

                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Use the import panel below to sync courses and assignments.
                </div>
              </div>
            ) : (
              // Not connected state - show setup options
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Choose your setup method:</h4>
                  <div className="grid gap-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <div>
                        <div className="font-medium">Guided Setup</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Step-by-step walkthrough with screenshots
                        </div>
                      </div>
                      <Button onClick={() => setShowWizard(true)}>
                        Start Guide
                      </Button>
                    </div>

                    <div className="border-t pt-3">
                      <QuickCanvasSetup
                        onSuccess={handleCanvasConnectionSuccess}
                        onShowWizard={() => setShowWizard(true)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        {connected && (
          <div className={highlightImport ? "ring-2 ring-blue-500 ring-offset-2 rounded-lg" : ""}>
            <CanvasImportPanel />
          </div>
        )}
        <DangerZone />
      </div>

      {/* Canvas Setup Wizard */}
      <CanvasSetupWizard
        isOpen={showWizard}
        onClose={() => setShowWizard(false)}
        onSuccess={handleCanvasConnectionSuccess}
      />
    </AppShell>
  );
}


