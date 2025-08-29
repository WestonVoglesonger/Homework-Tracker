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

  // Check if current user is admin
  const { data: isAdmin, isLoading: isAdminLoading } = useQuery({
    queryKey: ["admin", "status", session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return false;
      
      const response = await fetch("/api/admin/status");
      if (!response.ok) return false;
      
      const data = await response.json();
      return data.isAdmin;
    },
    enabled: !!session?.user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

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
      // Invalidate admin status query
      queryClient.invalidateQueries({ queryKey: ["admin", "status"] });
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
      enabled: isAdmin,
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
      enabled: isAdmin,
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
      enabled: isAdmin,
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

  return {
    isAdmin,
    isAdminLoading,
    promoteToAdmin: promoteToAdminMutation.mutateAsync,
    isPromoting: promoteToAdminMutation.isPending,
    promoteError: promoteToAdminMutation.error,
    useErrorLogs,
    useAnalytics,
    useUsers,
    resolveError: resolveErrorMutation.mutateAsync,
    isResolvingError: resolveErrorMutation.isPending,
  };
}