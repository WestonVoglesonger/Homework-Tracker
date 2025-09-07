"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@components/ui/dialog";
import { Button } from "@components/ui/button";
import { Card, CardContent } from "@components/ui/card";
import { Badge } from "@components/ui/badge";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { Spinner } from "@components/ui/spinner";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  CheckCircle,
  Copy,
  AlertCircle
} from "lucide-react";

// Prefer a public env var if set, otherwise default to UNC's Canvas domain
const canvasLoginUrl = (process.env.NEXT_PUBLIC_CANVAS_BASE_URL as string) || "https://uncch.instructure.com";

interface CanvasSetupWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface SetupStep {
  id: string;
  title: string;
  description: string;
  screenshot?: string;
  action?: {
    text: string;
    url?: string;
    external?: boolean;
  };
  note?: string;
}

const setupSteps: SetupStep[] = [
  {
    id: "login",
    title: "Login to Canvas",
    description: "First, make sure you're logged into your Canvas account. If you need to log in, use your school credentials.",
    screenshot: "/canvas-screenshots/canvas-login.png",
    action: {
      text: "Open Canvas",
      url: canvasLoginUrl,
      external: true
    },
    note: "Use your school email and password to log in."
  },
  {
    id: "account-menu",
    title: "Navigate to Account Settings",
    description: "Click on 'Account' in the left sidebar, then select 'Settings' from the dropdown menu.",
    screenshot: "/canvas-screenshots/account-menu.png",
    note: "Look for the Account option in the global navigation menu."
  },
  {
    id: "integrations",
    title: "Go to Approved Integrations",
    description: "In your Account Settings, scroll down and click on 'Approved Integrations' in the left sidebar.",
    screenshot: "/canvas-screenshots/approved-integrations.png",
    note: "This section manages your personal access tokens."
  },
  {
    id: "generate-token",
    title: "Generate New Access Token",
    description: "Click the '+ New Access Token' button to create a new personal access token for the Homework Tracker.",
    screenshot: "/canvas-screenshots/generate-token.png",
    note: "Give your token a descriptive name like 'Homework Tracker'."
  },
  {
    id: "copy-token",
    title: "Copy Your Access Token",
    description: "After generating the token, copy the token value that appears. Keep this secure and don't share it with anyone.",
    screenshot: "/canvas-screenshots/copy-token.png",
    note: "⚠️ This token will only be shown once. Make sure to copy it now!"
  },
  {
    id: "select-courses",
    title: "Select Courses to Import",
    description: "After connecting your Canvas account, you'll be taken to the Settings page where you can choose which courses to import. You can select multiple courses at once.",
    note: "The import process may take a minute or two depending on how many assignments your courses have."
  }
];

export function CanvasSetupWizard({ isOpen, onClose, onSuccess }: CanvasSetupWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [token, setToken] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [dontShowAgain, setDontShowAgain] = useState(false);


  const isTokenStep = currentStep === setupSteps.length - 1;
  const isLastStep = currentStep === setupSteps.length;
  const currentStepData = isLastStep ? null : setupSteps[currentStep];

  const handleNext = () => {
    if (currentStep < setupSteps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };


  const copyTokenToClipboard = () => {
    navigator.clipboard.writeText(token);
    toast.success("Token copied to clipboard!");
  };

  const persistDismiss = async (dismissed: boolean) => {
    try {
      await fetch("/api/user/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ canvasSetupDismissed: dismissed }),
      });
    } catch {}
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        if (dontShowAgain) persistDismiss(true);
        onClose();
      }
    }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>Connect to Canvas</span>
            <Badge variant="secondary">
              Step {currentStep + 1} of {setupSteps.length + 1}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Follow these steps to generate and connect your Canvas personal access token.
          </DialogDescription>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="flex items-center gap-2 mb-6">
          {setupSteps.map((_, index) => (
            <div key={index} className="flex items-center flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  index < currentStep
                    ? "bg-green-500 text-white"
                    : index === currentStep
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {index < currentStep ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  index + 1
                )}
              </div>
              {index < setupSteps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 ${
                    index < currentStep ? "bg-green-500" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          ))}
          <div className="flex items-center flex-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ml-2 ${
                isLastStep ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-500"
              }`}
            >
              {setupSteps.length + 1}
            </div>
          </div>
        </div>

        {/* Step Content */}
        {!isLastStep && currentStepData && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-2">{currentStepData.title}</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {currentStepData.description}
              </p>
              {currentStepData.note && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      {currentStepData.note}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Screenshot */}
            {currentStepData.screenshot && (
              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="bg-gray-100 dark:bg-gray-800 p-4 text-center text-sm text-gray-600 dark:text-gray-400">
                    Screenshot: {currentStepData.title}
                  </div>
                  <div className="relative bg-gray-50 dark:bg-gray-900 min-h-[300px]">
                    <Image
                      src={currentStepData.screenshot}
                      alt={`Screenshot - ${currentStepData.title}`}
                      fill
                      className="object-contain"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Button */}
            {currentStepData.action && (
              <div className="flex justify-center">
                <Button
                  onClick={() => {
                    if (currentStepData.action?.url) {
                      if (currentStepData.action.external) {
                        window.open(currentStepData.action.url, '_blank');
                      } else {
                        window.location.href = currentStepData.action.url;
                      }
                    }
                  }}
                  className="flex items-center gap-2"
                >
                  {currentStepData.action.text}
                  {currentStepData.action.external && <ExternalLink className="w-4 h-4" />}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Token Input Step */}
        {isLastStep && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-2">Enter Your Canvas Token</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Paste the access token you just generated from Canvas.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="canvas-token">Canvas Access Token</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="canvas-token"
                    type="password"
                    placeholder="Paste your Canvas access token here..."
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    className="flex-1"
                  />
                  {token && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyTokenToClipboard}
                      className="flex items-center gap-2"
                    >
                      <Copy className="w-4 h-4" />
                      Copy
                    </Button>
                  )}
                </div>
              </div>

              {validationError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-red-800 dark:text-red-200">
                      {validationError}
                    </p>
                  </div>
                </div>
              )}

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    <strong>Security Note:</strong> Your token is stored securely and encrypted.
                    You can revoke this token anytime from your Canvas account settings.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Don't show again */}
        <div className="flex items-center gap-2 mt-4">
          <input
            id="dont-show"
            type="checkbox"
            className="h-4 w-4"
            checked={dontShowAgain}
            onChange={(e) => setDontShowAgain(e.target.checked)}
          />
          <label htmlFor="dont-show" className="text-sm text-gray-600 dark:text-gray-300">Don&apos;t show this again</label>
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-6 border-t">
          <Button
            variant="outline"
            onClick={currentStep === 0 ? () => {
              if (dontShowAgain) persistDismiss(true);
              onClose();
            } : handlePrevious}
            disabled={isValidating}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            {currentStep === 0 ? "Cancel" : "Previous"}
          </Button>

          <div className="flex gap-2">
            {!isLastStep && (
              <Button
                variant="outline"
                onClick={() => setCurrentStep(setupSteps.length)}
              >
                Skip Tutorial
              </Button>
            )}

            {!isLastStep ? (
              <Button onClick={handleNext}>
                {isTokenStep ? "Connect Canvas" : "Next"}
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={async () => {
                  if (token.trim()) {
                    // Save the token first, then redirect
                    try {
                      setIsValidating(true);
                      const res = await fetch("/api/canvas/token", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ accessToken: token.trim() }),
                      });

                      if (res.ok) {
                        toast.success("Canvas connected! Redirecting...");
                        onSuccess();
                        setTimeout(() => {
                          // Always redirect to settings page after Canvas setup completion
                          window.location.href = "/settings?canvas-import=true";
                        }, 500);
                      } else {
                        const error = await res.text();
                        setValidationError(error || "Failed to save token");
                      }
                    } catch {
                      setValidationError("Failed to connect to Canvas");
                    } finally {
                      setIsValidating(false);
                    }
                  } else {
                    setValidationError("Please enter a token");
                  }
                }}
                disabled={isValidating}
                className="flex items-center gap-2"
              >
                {isValidating ? (
                  <>
                    <Spinner size={16} />
                    Connecting...
                  </>
                ) : (
                  <>
                    Go to Settings
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
