"use client";

import { useState, useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';
import { Button } from '@components/ui/button';

interface FirstOpenPopoverProps {
  currentStreak: number;
  isVisible: boolean;
  onDismiss: () => void;
}

export function FirstOpenPopover({ currentStreak, isVisible, onDismiss }: FirstOpenPopoverProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      // Start animation after a brief delay
      const timer = setTimeout(() => setIsAnimating(true), 100);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        className={`bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-sm w-full mx-4 transform transition-all duration-500 ${
          isAnimating ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        {/* Close button */}
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 text-center">
          {/* Sparkle icon */}
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Sparkles className="w-12 h-12 text-yellow-500 animate-pulse" />
              <div className="absolute inset-0 animate-ping">
                <Sparkles className="w-12 h-12 text-yellow-400 opacity-75" />
              </div>
            </div>
          </div>

          {/* Message */}
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Nice!
          </h2>
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
            Day {currentStreak} of your study streak.
          </p>

          {/* CTA Button */}
          <Button
            onClick={onDismiss}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition-all duration-200"
          >
            Keep it up! ✨
          </Button>
        </div>
      </div>
    </div>
  );
}
