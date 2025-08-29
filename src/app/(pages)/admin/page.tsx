"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useAdmin } from "@/app/hooks/useAdmin";
import AppShell from "@/app/components/layout/AppShell";
import { Card } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { 
  AlertCircle, 
  Users, 
  Activity, 
  TrendingUp, 
  Database,
  Shield,
  Clock,
  CheckCircle
} from "lucide-react";

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const { isAdmin, isAdminLoading } = useAdmin();
  const { resolveError, isResolvingError } = useAdmin();
  const router = useRouter();
  const [selectedTimeRange, setSelectedTimeRange] = useState<"day" | "week" | "month">("day");

  // Analytics queries
  const { data: systemMetrics, isLoading: systemLoading } = useAdmin().useAnalytics({
    type: "system",
  });

  const { data: dashboardMetrics, isLoading: dashboardLoading } = useAdmin().useAnalytics({
    type: "dashboard",
    timeRange: selectedTimeRange,
  });

  const { data: errorLogs, isLoading: errorsLoading } = useAdmin().useErrorLogs({
    limit: 10,
    resolved: false,
  });

  const { data: users, isLoading: usersLoading } = useAdmin().useUsers({
    limit: 10,
  });

  // Handle redirects in useEffect to avoid setState during render
  useEffect(() => {
    if (status !== "loading" && !isAdminLoading) {
      if (!session) {
        router.push("/auth/signin");
      } else if (!isAdmin) {
        router.push("/admin/auth");
      }
    }
  }, [session, isAdmin, status, isAdminLoading, router]);

  if (status === "loading" || isAdminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session || !isAdmin) {
    return null;
  }

  return (
    <AppShell>
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Admin Dashboard
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Monitor system health, user activity, and error logs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-green-600" />
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Admin Access
          </Badge>
        </div>
      </div>

      {/* System Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Users
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {systemLoading ? "..." : systemMetrics?.totalUsers || 0}
              </p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Active Today
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {systemLoading ? "..." : systemMetrics?.activeUsersToday || 0}
              </p>
            </div>
            <Activity className="h-8 w-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Courses
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {systemLoading ? "..." : systemMetrics?.totalCourses || 0}
              </p>
            </div>
            <Database className="h-8 w-8 text-purple-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Errors (24h)
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {systemLoading ? "..." : systemMetrics?.errorCount || 0}
              </p>
            </div>
            <AlertCircle className={`h-8 w-8 ${(systemMetrics?.errorCount || 0) > 10 ? 'text-red-600' : 'text-yellow-600'}`} />
          </div>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="errors">Error Logs</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Errors */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Recent Errors
              </h3>
              {errorsLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-12 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                  ))}
                </div>
              ) : errorLogs && errorLogs.length > 0 ? (
                <div className="space-y-3">
                  {errorLogs.slice(0, 5).map((error: any) => (
                    <div key={error.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {error.message}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {error.user?.email || "Unknown user"} • {new Date(error.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <Badge variant={error.level === "ERROR" ? "destructive" : "secondary"}>
                        {error.level}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                  No recent errors
                </p>
              )}
            </Card>

            {/* System Health */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                System Health
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Database</span>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Healthy
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">API Response</span>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Normal
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Error Rate</span>
                  <Badge variant={
                    (systemMetrics?.errorCount || 0) > 10 ? "destructive" : 
                    (systemMetrics?.errorCount || 0) > 5 ? "secondary" : "outline"
                  } className={
                    (systemMetrics?.errorCount || 0) <= 5 ? "bg-green-50 text-green-700 border-green-200" : ""
                  }>
                    {(systemMetrics?.errorCount || 0) <= 5 ? (
                      <CheckCircle className="h-3 w-3 mr-1" />
                    ) : (
                      <AlertCircle className="h-3 w-3 mr-1" />
                    )}
                    {(systemMetrics?.errorCount || 0) <= 5 ? "Low" : 
                     (systemMetrics?.errorCount || 0) <= 10 ? "Medium" : "High"}
                  </Badge>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="errors">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Error Logs
              </h3>
              <Button variant="outline" size="sm">
                Export Logs
              </Button>
            </div>
            
            {errorsLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                ))}
              </div>
            ) : errorLogs && errorLogs.length > 0 ? (
              <div className="space-y-3">
                {errorLogs.map((error: any) => (
                  <div key={error.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={error.level === "ERROR" ? "destructive" : "secondary"}>
                            {error.level}
                          </Badge>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(error.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                          {error.message}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          User: {error.user?.email || "Unknown"} • 
                          Endpoint: {error.endpoint || "N/A"}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => resolveError(error.id)}
                        disabled={isResolvingError}
                      >
                        {isResolvingError ? "Resolving..." : "Resolve"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No error logs found</p>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              User Management
            </h3>
            
            {usersLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                ))}
              </div>
            ) : users && users.length > 0 ? (
              <div className="space-y-3">
                {users.map((user: any) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          {user.name?.[0] || user.email?.[0] || "U"}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.name || "No name"}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {user.isAdmin && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          Admin
                        </Badge>
                      )}
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {user._count.courses} courses
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                No users found
              </p>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Analytics Overview
              </h3>
              <div className="flex items-center gap-2">
                <Button
                  variant={selectedTimeRange === "day" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTimeRange("day")}
                >
                  24h
                </Button>
                <Button
                  variant={selectedTimeRange === "week" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTimeRange("week")}
                >
                  7d
                </Button>
                <Button
                  variant={selectedTimeRange === "month" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTimeRange("month")}
                >
                  30d
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Total Events
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {dashboardLoading ? "..." : dashboardMetrics?.totalEvents || 0}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-blue-600" />
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Unique Users
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {dashboardLoading ? "..." : dashboardMetrics?.uniqueUsers || 0}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-green-600" />
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Page Views
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {dashboardLoading ? "..." : dashboardMetrics?.pageViews || 0}
                    </p>
                  </div>
                  <Activity className="h-8 w-8 text-purple-600" />
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
    </AppShell>
  );
}
