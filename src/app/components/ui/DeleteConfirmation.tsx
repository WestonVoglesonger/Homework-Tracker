import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog";

interface DeleteConfirmationProps {
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  children: React.ReactNode;
}

/**
 * Centralized Delete Confirmation Component
 *
 * Consistent delete confirmation dialog with customizable messages
 */
export function DeleteConfirmation({
  title = "Are you sure?",
  description = "This action cannot be undone.",
  confirmText = "Delete",
  cancelText = "Cancel",
  destructive = true,
  onConfirm,
  onCancel,
  children,
}: DeleteConfirmationProps) {
  const handleConfirm = async () => {
    try {
      await onConfirm();
    } catch (error) {
      // Handle error if needed
      console.error("Delete confirmation error:", error);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md shadow-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className={`px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              destructive
                ? "bg-red-600 hover:bg-red-700 focus:ring-red-500"
                : "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
            }`}
          >
            {confirmText}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Pre-configured Delete Confirmation Components
 */

interface DeleteAssignmentConfirmationProps {
  assignmentTitle: string;
  onConfirm: () => void | Promise<void>;
  children: React.ReactNode;
}

export function DeleteAssignmentConfirmation({
  assignmentTitle,
  onConfirm,
  children,
}: DeleteAssignmentConfirmationProps) {
  return (
    <DeleteConfirmation
      title="Delete Assignment"
      description={`Are you sure you want to delete "${assignmentTitle}"? This action cannot be undone.`}
      confirmText="Delete Assignment"
      onConfirm={onConfirm}
    >
      {children}
    </DeleteConfirmation>
  );
}

interface DeleteCourseConfirmationProps {
  courseName: string;
  onConfirm: () => void | Promise<void>;
  children: React.ReactNode;
}

export function DeleteCourseConfirmation({
  courseName,
  onConfirm,
  children,
}: DeleteCourseConfirmationProps) {
  return (
    <DeleteConfirmation
      title="Delete Course"
      description={`Are you sure you want to delete "${courseName}" and all its assignments? This action cannot be undone.`}
      confirmText="Delete Course"
      onConfirm={onConfirm}
    >
      {children}
    </DeleteConfirmation>
  );
}

interface DeleteAccountConfirmationProps {
  onConfirm: () => void | Promise<void>;
  children: React.ReactNode;
}

export function DeleteAccountConfirmation({
  onConfirm,
  children,
}: DeleteAccountConfirmationProps) {
  return (
    <DeleteConfirmation
      title="Delete Account"
      description="This will permanently delete your account and all associated data. This action cannot be undone."
      confirmText="Delete Account"
      onConfirm={onConfirm}
    >
      {children}
    </DeleteConfirmation>
  );
}

/**
 * Hook for handling delete confirmations
 */
export function useDeleteConfirmation() {
  const [pending, setPending] = useState(false);

  const confirmDelete = async (
    message: string,
    onConfirm: () => void | Promise<void>
  ) => {
    if (!confirm(message)) return;

    setPending(true);
    try {
      await onConfirm();
    } catch (error) {
      console.error("Delete error:", error);
    } finally {
      setPending(false);
    }
  };

  return {
    confirmDelete,
    pending,
  };
}
