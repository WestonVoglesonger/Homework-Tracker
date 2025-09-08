import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

interface AdminPromoteData {
  email: string;
  password: string;
  adminPassword: string;
}

interface ErrorLogFilters {
  level?: string;
  userId?: string;
  resolved?: boolean;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

interface AnalyticsFilters {
  timeRange?: "day" | "week" | "month";
  type?: "dashboard" | "system" | "events";
  event?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export function useAdmin() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  // Get admin status from session (no additional API call needed)
  const isAdmin = Boolean((session?.user as { isAdmin?: boolean } | undefined)?.isAdmin);
  const isAdminLoading = false; // Admin status comes from session, so no loading state

  // Promote user to admin
  const promoteToAdminMutation = useMutation({
    mutationFn: async (data: AdminPromoteData) => {
      const response = await fetch("/api/admin/auth/promote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to promote to admin");
      }

      return response.json();
    },
    onSuccess: () => {
      // Admin status is derived from session, so no invalidation needed
    },
  });

  // Get error logs
  const useErrorLogs = (filters?: ErrorLogFilters) => {
    return useQuery({
      queryKey: ["admin", "errorLogs", filters],
      queryFn: async () => {
        const params = new URLSearchParams();
        if (filters?.level) params.append("level", filters.level);
        if (filters?.userId) params.append("userId", filters.userId);
        if (filters?.resolved !== undefined) params.append("resolved", filters.resolved.toString());
        if (filters?.startDate) params.append("startDate", filters.startDate);
        if (filters?.endDate) params.append("endDate", filters.endDate);
        if (filters?.limit) params.append("limit", filters.limit.toString());
        if (filters?.offset) params.append("offset", filters.offset.toString());

        const response = await fetch(`/api/admin/errors?${params}`);
        if (!response.ok) {
          throw new Error("Failed to fetch error logs");
        }
        return response.json();
      },
      enabled: isAdmin && !!session?.user?.id,
      staleTime: 30 * 1000, // 30 seconds
    });
  };

  // Get analytics data
  const useAnalytics = (filters?: AnalyticsFilters) => {
    return useQuery({
      queryKey: ["admin", "analytics", filters],
      queryFn: async () => {
        const params = new URLSearchParams();
        if (filters?.timeRange) params.append("timeRange", filters.timeRange);
        if (filters?.type) params.append("type", filters.type);
        if (filters?.event) params.append("event", filters.event);
        if (filters?.userId) params.append("userId", filters.userId);
        if (filters?.startDate) params.append("startDate", filters.startDate);
        if (filters?.endDate) params.append("endDate", filters.endDate);
        if (filters?.limit) params.append("limit", filters.limit.toString());
        if (filters?.offset) params.append("offset", filters.offset.toString());

        const response = await fetch(`/api/admin/analytics?${params}`);
        if (!response.ok) {
          throw new Error("Failed to fetch analytics");
        }
        return response.json();
      },
      enabled: isAdmin && !!session?.user?.id,
      staleTime: 60 * 1000, // 1 minute
    });
  };

  // Get users
  const useUsers = (filters?: { isAdmin?: boolean; limit?: number; offset?: number }) => {
    return useQuery({
      queryKey: ["admin", "users", filters],
      queryFn: async () => {
        const params = new URLSearchParams();
        if (filters?.isAdmin !== undefined) params.append("isAdmin", filters.isAdmin.toString());
        if (filters?.limit) params.append("limit", filters.limit.toString());
        if (filters?.offset) params.append("offset", filters.offset.toString());

        const response = await fetch(`/api/admin/users?${params}`);
        if (!response.ok) {
          throw new Error("Failed to fetch users");
        }
        return response.json();
      },
      enabled: isAdmin && !!session?.user?.id,
      staleTime: 60 * 1000, // 1 minute
    });
  };

  // Resolve error log
  const resolveErrorMutation = useMutation({
    mutationFn: async (errorLogId: string) => {
      const response = await fetch("/api/admin/errors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resolve", errorLogId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to resolve error");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "errorLogs"] });
    },
  });

  // Get waitlist users
  const useWaitlistUsers = (filters?: { converted?: boolean; limit?: number; offset?: number }) => {
    return useQuery({
      queryKey: ["admin", "waitlist", "users", filters],
      queryFn: async () => {
        const params = new URLSearchParams();
        if (filters?.converted !== undefined) params.append("converted", filters.converted.toString());
        if (filters?.limit) params.append("limit", filters.limit.toString());
        if (filters?.offset) params.append("offset", filters.offset.toString());

        const response = await fetch(`/api/admin/waitlist?${params}`);
        if (!response.ok) {
          throw new Error("Failed to fetch waitlist users");
        }
        return response.json();
      },
      enabled: isAdmin && !!session?.user?.id,
      staleTime: 30 * 1000, // 30 seconds
    });
  };

  // Get waitlist stats
  const useWaitlistStats = () => {
    return useQuery({
      queryKey: ["admin", "waitlist", "stats"],
      queryFn: async () => {
        const response = await fetch("/api/admin/waitlist/stats");
        if (!response.ok) {
          throw new Error("Failed to fetch waitlist stats");
        }
        return response.json();
      },
      enabled: isAdmin && !!session?.user?.id,
      staleTime: 60 * 1000, // 1 minute
    });
  };

  // Convert waitlist user
  const convertWaitlistUserMutation = useMutation({
    mutationFn: async (data: { waitlistId?: string; convertAll?: boolean }) => {
      const response = await fetch("/api/admin/waitlist/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to convert user");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "waitlist"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "analytics"] });
    },
  });

  // Get system settings
  const useSystemSettings = () => {
    return useQuery({
      queryKey: ["admin", "settings"],
      queryFn: async () => {
        const response = await fetch("/api/admin/settings");
        if (!response.ok) {
          throw new Error("Failed to fetch settings");
        }
        return response.json();
      },
      enabled: isAdmin && !!session?.user?.id,
      staleTime: 60 * 1000, // 1 minute
    });
  };

  // Update system settings
  const updateSystemSettingsMutation = useMutation({
    mutationFn: async (settings: { maxUsers: number }) => {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update settings");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "settings"] });
    },
  });

  return {
    isAdmin,
    isAdminLoading,
    promoteToAdmin: promoteToAdminMutation.mutateAsync,
    isPromoting: promoteToAdminMutation.isPending,
    promoteError: promoteToAdminMutation.error,
    useErrorLogs,
    useAnalytics,
    useUsers,
    useWaitlistUsers,
    useWaitlistStats,
    convertWaitlistUser: convertWaitlistUserMutation.mutateAsync,
    isConvertingWaitlistUser: convertWaitlistUserMutation.isPending,
    useSystemSettings,
    updateSystemSettings: updateSystemSettingsMutation.mutateAsync,
    isUpdatingSettings: updateSystemSettingsMutation.isPending,
    resolveError: resolveErrorMutation.mutateAsync,
    isResolvingError: resolveErrorMutation.isPending,
  };
}