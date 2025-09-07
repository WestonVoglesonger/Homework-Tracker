import { useCallback } from "react";
import { toast } from "sonner";

/**
 * Centralized Notification System
 *
 * Provides consistent user feedback across the application
 */

export type NotificationType = "success" | "error" | "warning" | "info";

interface NotificationOptions {
  title?: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

class NotificationManager {
  private static instance: NotificationManager;

  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  success(message: string, options?: NotificationOptions) {
    return toast.success(options?.title || message, {
      description: options?.title ? message : options?.description,
      duration: options?.duration,
      action: options?.action ? {
        label: options.action.label,
        onClick: options.action.onClick,
      } : undefined,
    });
  }

  error(message: string, options?: NotificationOptions) {
    return toast.error(options?.title || message, {
      description: options?.title ? message : options?.description,
      duration: options?.duration,
      action: options?.action ? {
        label: options.action.label,
        onClick: options.action.onClick,
      } : undefined,
    });
  }

  warning(message: string, options?: NotificationOptions) {
    return toast.warning(options?.title || message, {
      description: options?.title ? message : options?.description,
      duration: options?.duration,
      action: options?.action ? {
        label: options.action.label,
        onClick: options.action.onClick,
      } : undefined,
    });
  }

  info(message: string, options?: NotificationOptions) {
    return toast.info(options?.title || message, {
      description: options?.title ? message : options?.description,
      duration: options?.duration,
      action: options?.action ? {
        label: options.action.label,
        onClick: options.action.onClick,
      } : undefined,
    });
  }

  dismiss(toastId: string | number) {
    toast.dismiss(toastId);
  }

  dismissAll() {
    toast.dismiss();
  }
}

export const notificationManager = NotificationManager.getInstance();

/**
 * React Hook for Notifications
 *
 * Provides convenient methods for showing notifications
 */
export function useNotifications() {
  const notify = useCallback((type: NotificationType, message: string, options?: NotificationOptions) => {
    return notificationManager[type](message, options);
  }, []);

  const success = useCallback((message: string, options?: NotificationOptions) => {
    return notificationManager.success(message, options);
  }, []);

  const error = useCallback((message: string, options?: NotificationOptions) => {
    return notificationManager.error(message, options);
  }, []);

  const warning = useCallback((message: string, options?: NotificationOptions) => {
    return notificationManager.warning(message, options);
  }, []);

  const info = useCallback((message: string, options?: NotificationOptions) => {
    return notificationManager.info(message, options);
  }, []);

  const dismiss = useCallback((toastId: string | number) => {
    notificationManager.dismiss(toastId);
  }, []);

  const dismissAll = useCallback(() => {
    notificationManager.dismissAll();
  }, []);

  return {
    notify,
    success,
    error,
    warning,
    info,
    dismiss,
    dismissAll,
  };
}

/**
 * Pre-configured Notification Messages
 */

export const notificationMessages = {
  // Authentication
  loginSuccess: "Welcome back! You've been successfully signed in.",
  loginError: "Failed to sign in. Please check your credentials and try again.",
  logoutSuccess: "You've been successfully signed out.",

  // Assignments
  assignmentCreated: "Assignment created successfully!",
  assignmentUpdated: "Assignment updated successfully!",
  assignmentDeleted: "Assignment deleted successfully.",
  assignmentDeleteError: "Failed to delete assignment. Please try again.",

  // Courses
  courseCreated: "Course created successfully!",
  courseUpdated: "Course updated successfully!",
  courseDeleted: "Course deleted successfully.",
  courseDeleteError: "Failed to delete course. Please try again.",

  // Canvas Integration
  canvasConnected: "Canvas account connected successfully!",
  canvasSyncStarted: "Syncing data from Canvas...",
  canvasSyncComplete: "Canvas data synced successfully!",
  canvasSyncError: "Failed to sync Canvas data. Please try again.",

  // Settings
  settingsUpdated: "Settings updated successfully!",
  dataExported: "Your data has been exported successfully.",

  // General
  networkError: "Network error. Please check your connection and try again.",
  serverError: "Server error. Please try again later.",
  validationError: "Please check your input and try again.",
  unexpectedError: "An unexpected error occurred. Please try again.",

  // Waitlist
  waitlistJoined: "You've been added to the waitlist! We'll notify you when space becomes available.",
  waitlistActivated: "Welcome! Your account has been activated.",

  // Admin
  userPromoted: "User promoted to admin successfully.",
  userDeleted: "User deleted successfully.",
  settingsSaved: "System settings saved successfully.",
} as const;

/**
 * Convenience Functions for Common Notifications
 */

export function notifyLoginSuccess() {
  notificationManager.success(notificationMessages.loginSuccess);
}

export function notifyLoginError() {
  notificationManager.error(notificationMessages.loginError);
}

export function notifyLogoutSuccess() {
  notificationManager.success(notificationMessages.logoutSuccess);
}

export function notifyAssignmentCreated() {
  notificationManager.success(notificationMessages.assignmentCreated);
}

export function notifyAssignmentDeleted() {
  notificationManager.success(notificationMessages.assignmentDeleted);
}

export function notifyCourseCreated() {
  notificationManager.success(notificationMessages.courseCreated);
}

export function notifyCourseDeleted() {
  notificationManager.success(notificationMessages.courseDeleted);
}

export function notifyCanvasConnected() {
  notificationManager.success(notificationMessages.canvasConnected);
}

export function notifyNetworkError() {
  notificationManager.error(notificationMessages.networkError);
}

export function notifyServerError() {
  notificationManager.error(notificationMessages.serverError);
}
