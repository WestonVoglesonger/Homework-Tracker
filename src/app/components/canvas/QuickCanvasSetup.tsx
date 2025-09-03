"use client";

import { useState } from "react";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Badge } from "@components/ui/badge";
import { Spinner } from "@components/ui/spinner";
import { toast } from "sonner";
import { ExternalLink, AlertCircle, CheckCircle, Zap } from "lucide-react";

interface QuickCanvasSetupProps {
  onSuccess: () => void;
  onShowWizard: () => void;
}

export function QuickCanvasSetup({ onSuccess, onShowWizard }: QuickCanvasSetupProps) {
  const [token, setToken] = useState("");
  const [isValidating, setIsValidating] = useState(false);

  const validateToken = async () => {
    if (!token.trim()) {
      toast.error("Please enter a Canvas access token");
      return;
    }

    setIsValidating(true);

    try {
      const res = await fetch("/api/canvas/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: token.trim() }),
      });

      if (res.ok) {
        toast.success("Canvas connected successfully! Redirecting to settings...");
        setToken("");
        onSuccess();
        setTimeout(() => {
          window.location.href = "/settings?canvas-import=true";
        }, 500);
      } else {
        const error = await res.text();
        toast.error(error || "Invalid token. Please check and try again.");
      }
    } catch (error) {
      toast.error("Failed to connect to Canvas. Please try again.");
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Quick Setup
          <Badge variant="secondary">Advanced</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-gray-600 dark:text-gray-300">
          Already know how to generate a Canvas token? Skip the guided tutorial and connect directly.
        </div>

        <div className="space-y-3">
          <div>
            <Label htmlFor="quick-token">Canvas Access Token</Label>
            <Input
              id="quick-token"
              type="password"
              placeholder="Paste your Canvas access token..."
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="mt-1"
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={validateToken}
              disabled={!token.trim() || isValidating}
              className="flex items-center gap-2"
            >
              {isValidating ? (
                <>
                  <Spinner size={16} />
                  Connecting...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Connect Canvas
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={onShowWizard}
              className="flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Show Step-by-Step Guide
            </Button>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">Don't have a token yet?</p>
              <p>Generate one in Canvas: Account → Settings → Approved Integrations → New Access Token</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
