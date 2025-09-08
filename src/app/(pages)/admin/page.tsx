"use client";

import { useState } from "react";
import { useAdmin } from "@/app/hooks/useAdmin";
import AppShell from "@/app/components/layout/AppShell";
import { Card } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import {
  AdminMetricCard,
  AdminStatusCard,
  AdminListCard,
  AdminUserCard,
  AdminErrorCard,
  AdminStatsGrid,
  AdminDashboardLayout
} from "@/app/components/admin/AdminComponents";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import {
  AlertCircle,
  Users,
  Activity,
  TrendingUp,
  Database,
  Shield,
  Clock,
  UserCheck,
  UserPlus
} from "lucide-react";

export default function AdminDashboard() {
  const admin = useAdmin();
  const [selectedTimeRange, setSelectedTimeRange] = useState<"day" | "week" | "month">("day");
  const [newMaxUsers, setNewMaxUsers] = useState<string>("");

  // Destructure all needed properties from the single useAdmin() call
  const {
    resolveError,
    isResolvingError,
    convertWaitlistUser,
    isConvertingWaitlistUser,
    updateSystemSettings,
    isUpdatingSettings,
    useAnalytics,
    useErrorLogs,
    useUsers,
    useWaitlistStats,
    useWaitlistUsers,
    useSystemSettings
  } = admin;

  // Analytics queries
  const { data: systemMetrics, isLoading: systemLoading } = useAnalytics({
    type: "system",
  });

  const { data: dashboardMetrics, isLoading: dashboardLoading } = useAnalytics({
    type: "dashboard",
    timeRange: selectedTimeRange,
  });

  const { data: errorLogs, isLoading: errorsLoading } = useErrorLogs({
    limit: 10,
    resolved: false,
  });

  const { data: users, isLoading: usersLoading } = useUsers({
    limit: 10,
  });

  // Waitlist queries
  const { data: waitlistStats, isLoading: waitlistStatsLoading } = useWaitlistStats();
  const { data: waitlistUsers, isLoading: waitlistUsersLoading } = useWaitlistUsers({
    converted: false,
    limit: 20,
  });

  // System settings query
  const { data: systemSettings, isLoading: settingsLoading } = useSystemSettings();


  return (
    <AppShell>
      <AdminDashboardLayout
        title="Admin Dashboard"
        description="Monitor system health, user activity, and error logs"
        actions={
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600" />
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              Admin Access
            </Badge>
          </div>
        }
      >

      {/* System Overview Cards */}
      <AdminStatsGrid>
        <AdminMetricCard
          title="Total Users"
          value={systemLoading ? "..." : systemMetrics?.totalUsers || 0}
          icon={<Users className="h-8 w-8" />}
          loading={systemLoading}
        />

        <AdminMetricCard
          title="Active Today"
          value={systemLoading ? "..." : systemMetrics?.activeUsersToday || 0}
          icon={<Activity className="h-8 w-8" />}
          loading={systemLoading}
          status="success"
        />

        <AdminMetricCard
          title="Total Courses"
          value={systemLoading ? "..." : systemMetrics?.totalCourses || 0}
          icon={<Database className="h-8 w-8" />}
          loading={systemLoading}
          status="warning"
        />

        <AdminMetricCard
          title="Errors (24h)"
          value={systemLoading ? "..." : systemMetrics?.errorCount || 0}
          icon={<AlertCircle className="h-8 w-8" />}
          loading={systemLoading}
          status={(systemMetrics?.errorCount || 0) > 10 ? "error" : "warning"}
        />
      </AdminStatsGrid>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="waitlist">Waitlist</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="errors">Error Logs</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Errors */}
            <AdminListCard
              title="Recent Errors"
              items={errorLogs?.slice(0, 5)}
              loading={errorsLoading}
              emptyMessage="No recent errors"
              renderItem={(error: { id: string; message: string; level: string; timestamp: string; user?: { email?: string }; endpoint?: string }) => (
                <AdminErrorCard
                  key={error.id}
                  error={error}
                  onResolve={resolveError}
                />
              )}
            />

            {/* System Health */}
            <AdminStatusCard
              title="System Health"
              status={(systemMetrics?.errorCount || 0) > 10 ? "error" : (systemMetrics?.errorCount || 0) > 5 ? "warning" : "healthy"}
              description="Current status of system components and performance metrics"
              metrics={[
                {
                  label: "Database",
                  value: "Healthy",
                  status: "healthy"
                },
                {
                  label: "API Response",
                  value: "Normal",
                  status: "healthy"
                },
                {
                  label: "Error Rate",
                  value: (systemMetrics?.errorCount || 0) <= 5 ? "Low" :
                         (systemMetrics?.errorCount || 0) <= 10 ? "Medium" : "High",
                  status: (systemMetrics?.errorCount || 0) <= 5 ? "healthy" :
                         (systemMetrics?.errorCount || 0) <= 10 ? "warning" : "error"
                }
              ]}
            />
          </div>
        </TabsContent>

        <TabsContent value="waitlist" className="space-y-6">
          {/* Waitlist Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Waitlist
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {waitlistStatsLoading ? "..." : waitlistStats?.total || 0}
                  </p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Pending
                  </p>
                  <p className="text-2xl font-bold text-orange-600">
                    {waitlistStatsLoading ? "..." : waitlistStats?.unconverted || 0}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Converted
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {waitlistStatsLoading ? "..." : waitlistStats?.converted || 0}
                  </p>
                </div>
                <UserCheck className="h-8 w-8 text-green-600" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Recent Joins
                  </p>
                  <p className="text-2xl font-bold text-purple-600">
                    {waitlistStatsLoading ? "..." : waitlistStats?.recentJoins || 0}
                  </p>
                </div>
                <UserPlus className="h-8 w-8 text-purple-600" />
              </div>
            </Card>
          </div>

          {/* Waitlist Actions */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Waitlist Management
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Convert waitlisted users to full users
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => convertWaitlistUser({ convertAll: true })}
                  disabled={isConvertingWaitlistUser || (waitlistStats?.unconverted || 0) === 0}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isConvertingWaitlistUser ? "Converting..." : `Convert All (${waitlistStats?.unconverted || 0})`}
                </Button>
              </div>
            </div>

            {/* Waitlist Users */}
            {waitlistUsersLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                ))}
              </div>
            ) : waitlistUsers?.users && waitlistUsers.users.length > 0 ? (
              <div className="space-y-3">
                {waitlistUsers.users.map((user: { id: string; name?: string; email: string; joinedAt: string }) => (
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
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Joined {new Date(user.joinedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => convertWaitlistUser({ waitlistId: user.id })}
                      disabled={isConvertingWaitlistUser}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {isConvertingWaitlistUser ? "Converting..." : "Convert"}
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <UserCheck className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No users on the waitlist</p>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  System Settings
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Configure system-wide settings and limits
                </p>
              </div>
            </div>

            {settingsLoading ? (
              <div className="space-y-4">
                <div className="h-20 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Max Users Setting */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-md font-medium text-gray-900 dark:text-white">
                        Maximum Users
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Set the maximum number of registered users allowed in the system
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">
                        {systemSettings?.currentUsers || 0} / {systemSettings?.maxUsers || 50}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Current / Maximum
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <input
                        type="number"
                        value={newMaxUsers}
                        onChange={(e) => setNewMaxUsers(e.target.value)}
                        placeholder={systemSettings?.maxUsers?.toString() || "50"}
                        min={systemSettings?.minAllowed || 0}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Minimum allowed: {systemSettings?.minAllowed || 0} (current user count)
                      </p>
                    </div>
                    <Button
                      onClick={async () => {
                        if (!newMaxUsers || parseInt(newMaxUsers) < (systemSettings?.minAllowed || 0)) {
                          alert(`Maximum users must be at least ${systemSettings?.minAllowed || 0}`);
                          return;
                        }

                        try {
                          await updateSystemSettings({ maxUsers: parseInt(newMaxUsers) });
                          setNewMaxUsers("");
                          alert("Settings updated successfully!");
                        } catch (error) {
                          alert("Failed to update settings: " + (error instanceof Error ? error.message : "Unknown error"));
                        }
                      }}
                      disabled={isUpdatingSettings || !newMaxUsers}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {isUpdatingSettings ? "Updating..." : "Update"}
                    </Button>
                  </div>
                </div>

                {/* Additional Settings Placeholder */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h4 className="text-md font-medium text-gray-900 dark:text-white mb-2">
                    Additional Settings
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    More system settings will be available here in future updates.
                  </p>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="errors">
          <AdminListCard
            title="Error Logs"
            items={errorLogs}
            loading={errorsLoading}
            emptyMessage="No error logs found"
            actions={
              <Button variant="outline" size="sm">
                Export Logs
              </Button>
            }
            renderItem={(error: { id: string; message: string; level: string; timestamp: string; user?: { email?: string }; endpoint?: string }) => (
              <AdminErrorCard
                key={error.id}
                error={error}
                onResolve={isResolvingError ? undefined : resolveError}
              />
            )}
          />
        </TabsContent>

        <TabsContent value="users">
          <AdminListCard
            title="User Management"
            items={users}
            loading={usersLoading}
            emptyMessage="No users found"
            renderItem={(user: { id: string; name?: string; email: string; isAdmin: boolean; _count: { courses: number } }) => (
              <AdminUserCard
                key={user.id}
                user={user}
                onAction={(action, userId) => {
                  // Handle user actions (view, edit, etc.)
                  console.log(`${action} user ${userId}`);
                }}
              />
            )}
          />
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
      </AdminDashboardLayout>
    </AppShell>
  );
}
