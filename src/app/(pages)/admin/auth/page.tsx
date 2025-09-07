"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Card } from "@/app/components/ui/card";
import { useAdmin } from "@/app/hooks/useAdmin";
import { toast } from "sonner";

export default function AdminAuthPage() {
  const { data: session, status } = useSession();
  const { promoteToAdmin, isPromoting, promoteError, isAdmin } = useAdmin();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    adminPassword: "",
  });

  // Redirect to admin dashboard if user is already admin
  useEffect(() => {
    if (isAdmin) {
      router.push("/admin");
    }
  }, [isAdmin, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) {
    router.push("/auth/signin");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await promoteToAdmin({
        email: formData.email.trim(),
        password: formData.password.trim(),
        adminPassword: formData.adminPassword.trim(),
      });
      toast.success("Successfully promoted to admin!");
      // The useEffect will handle the redirect when isAdmin becomes true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to promote to admin";
      toast.error(errorMessage);
      // Clear the admin password field on error for security
      setFormData(prev => ({ ...prev, adminPassword: "" }));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <Card className="w-full max-w-md p-6 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Admin Access
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Enter your credentials and admin password to gain admin access
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="your@email.com"
              required
              disabled={isPromoting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Your account password"
              required
              disabled={isPromoting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="adminPassword">Admin Password</Label>
            <Input
              id="adminPassword"
              name="adminPassword"
              type="password"
              value={formData.adminPassword}
              onChange={handleInputChange}
              placeholder="Admin password"
              required
              disabled={isPromoting}
            />
          </div>



          <Button
            type="submit"
            className="w-full"
            disabled={isPromoting || !formData.email || !formData.password || !formData.adminPassword}
          >
            {isPromoting ? "Processing..." : "Gain Admin Access"}
          </Button>
        </form>

        <div className="text-center">
          <Button
            variant="ghost"
            onClick={() => router.push("/dashboard")}
            className="text-sm"
          >
            Back to Dashboard
          </Button>
        </div>
      </Card>
    </div>
  );
}
