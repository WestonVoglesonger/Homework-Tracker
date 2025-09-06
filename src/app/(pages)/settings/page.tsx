"use client";
import AppShell from "@components/layout/AppShell";
import { useCanvasImport } from "@/app/hooks/useCanvasImport";
import { useEffect, useState } from "react";
import { Button } from "@components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Spinner } from "@components/ui/spinner";
import CanvasImportPanel from "@components/canvas/CanvasImportPanel";
import DangerZone from "@components/settings/DangerZone";
import Link from "next/link";
import { Download } from "lucide-react";

import { toast } from "sonner";
import { CanvasSetupWizard } from "@/app/components/canvas/CanvasSetupWizard";
import { QuickCanvasSetup } from "@/app/components/canvas/QuickCanvasSetup";

export default function SettingsPage() {
  const { listCanvasCourses } = useCanvasImport();
  const [connected, setConnected] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [lastExport, setLastExport] = useState<string | null>(null);
  const [showWizard, setShowWizard] = useState(false);
  const [highlightImport, setHighlightImport] = useState(false);
  useEffect(() => {
    let mounted = true;
    listCanvasCourses()
      .then((d) => {
        if (!mounted) return;
        setConnected(Array.isArray(d));
        setLoading(false);
      })
      .catch(() => {
        if (!mounted) return;
        setConnected(false);
        setLoading(false);
      });
    return () => { mounted = false; };
  }, [listCanvasCourses]);

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
    setLoading(false);
    // Refresh the connection status
    listCanvasCourses()
      .then((d) => setConnected(Array.isArray(d)))
      .catch(() => setConnected(false));
  };

  const handleExportData = async () => {
    setExportLoading(true);
    try {
      const res = await fetch("/api/user/data/export");
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `duenorth-data-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success("Data exported successfully");
        setLastExport(new Date().toISOString());
      } else {
        toast.error("Failed to export data");
      }
    } catch {
      toast.error("An error occurred while exporting data");
    } finally {
      setExportLoading(false);
    }
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
            {loading ? (
              // Loading state
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                  <Spinner size={20} />
                  <span className="text-sm">Checking Canvas connection...</span>
                </div>
              </div>
            ) : (
              // Loaded state
              <>
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
              </>
            )}
          </CardContent>
        </Card>
        {!loading && connected && (
          <div className={highlightImport ? "ring-2 ring-blue-500 ring-offset-2 rounded-lg" : ""}>
            <CanvasImportPanel />
          </div>
        )}

        {/* Your Data (export, retention info) */}
        <div id="data" />
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download size={20} />
              Export Your Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700 dark:text-gray-300">
              Download a copy of your DueNorth data, including courses, assignments, and account information.
            </p>
            {lastExport && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Last exported: {new Date(lastExport).toLocaleDateString()}
              </div>
            )}
            <Button onClick={handleExportData} disabled={exportLoading} className="w-full sm:w-auto">
              {exportLoading ? (
                <span className="inline-flex items-center gap-2">
                  <Spinner size={16} /> Exporting...
                </span>
              ) : (
                "Export Data"
              )}
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Data Retention & Security</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-gray-700 dark:text-gray-300">
            <div>
              <h4 className="font-medium mb-1">Immediate Deletion</h4>
              <p className="text-sm">Account data and Canvas tokens are removed instantly</p>
            </div>
            <div>
              <h4 className="font-medium mb-1">Backup Purging</h4>
              <p className="text-sm">Automated backups are permanently deleted within 30 days</p>
            </div>
            <div>
              <h4 className="font-medium mb-1">Audit Logs</h4>
              <p className="text-sm">Minimal security logs retained for 90 days, then automatically deleted</p>
            </div>
            <div>
              <h4 className="font-medium mb-1">Security Measures</h4>
              <p className="text-sm">All data encrypted at rest, secure transmission, regular security audits</p>
            </div>
            <div className="pt-2 text-sm">
              Questions? <Link href="mailto:westonvogle@duenorthapp.com" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">Contact westonvogle@duenorthapp.com</Link>
            </div>
          </CardContent>
        </Card>
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


