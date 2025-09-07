"use client";

import { Card } from "@components/ui/card";
import { Users, Clock } from "lucide-react";

export function WaitlistNotice() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4 md:p-6">
      <div className="text-center">
        <div className="mx-auto w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-6">
          <Clock className="w-12 h-12 text-blue-600" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          You&apos;re on the Waitlist!
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
          Thank you for your interest in DueNorth. We&apos;ve reached our current user limit, but you&apos;re on the list to get access as soon as space becomes available.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 text-center">
          <Users className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Stay Tuned</h3>
          <p className="text-gray-600 dark:text-gray-400">
            We&apos;ll notify you via email when your account becomes active.
          </p>
        </Card>

        <Card className="p-6 text-center">
          <Clock className="w-12 h-12 text-green-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Limited Access</h3>
          <p className="text-gray-600 dark:text-gray-400">
            For now, you can access your account settings and this page.
          </p>
        </Card>

      </div>

      <Card className="p-8 text-center bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
        <h3 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
          What happens next?
        </h3>
        <div className="space-y-3 text-left max-w-2xl mx-auto">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-sm font-bold">1</span>
            </div>
            <p className="text-gray-700 dark:text-gray-300">
              We&apos;ll notify you when your account becomes active.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-sm font-bold">2</span>
            </div>
            <p className="text-gray-700 dark:text-gray-300">
              Once activated, you&apos;ll have full access to all DueNorth features.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default WaitlistNotice;


