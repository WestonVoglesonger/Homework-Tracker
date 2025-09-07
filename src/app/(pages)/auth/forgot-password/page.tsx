"use client";
import { useState } from "react";
import { AuthForm } from "@/app/components/auth/AuthForm";
import { AuthSuccessPage } from "@/app/components/auth/AuthPage";

export default function ForgotPasswordPage() {
  const [done, setDone] = useState(false);

  async function onSubmit(data: Record<string, string>) {
    await fetch("/api/auth/password/forgot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: data.email }),
    });
    setDone(true);
  }

  if (done) {
    return (
      <AuthSuccessPage
        title="Check Your Email"
        message="If an account with that email exists, we've sent you a password reset link."
        actionText="Back to Sign In"
        actionHref="/auth/signin"
      />
    );
  }

  return (
    <AuthForm
      title="Forgot Password"
      description="Enter your email address and we'll send you a link to reset your password."
      onSubmit={onSubmit}
      fields={[
        {
          name: "email",
          label: "Email Address",
          type: "email",
          placeholder: "Enter your email",
          required: true,
          autoComplete: "email"
        }
      ]}
      submitText="Send Reset Link"
      loadingText="Sending..."
      footerLinks={[
        {
          text: "Remember your password?",
          href: "/auth/signin",
          linkText: "Sign In"
        }
      ]}
    />
  );
}


