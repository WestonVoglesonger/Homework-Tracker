import { describe, it, expect } from "vitest";
import { getSignInErrorMessage } from "../authErrors";

describe("getSignInErrorMessage", () => {
  it("returns empty string for empty code", () => {
    expect(getSignInErrorMessage("")).toBe("");
    expect(getSignInErrorMessage(null as string | null)).toBe("");
    expect(getSignInErrorMessage(undefined as string | undefined)).toBe("");
  });

  it("handles MissingCredentials", () => {
    expect(getSignInErrorMessage("MissingCredentials")).toContain("Please enter your email and password");
  });

  it("handles UserNotFound", () => {
    expect(getSignInErrorMessage("UserNotFound")).toContain("No account found");
  });

  it("handles InvalidPassword", () => {
    expect(getSignInErrorMessage("InvalidPassword")).toContain("Incorrect email or password");
  });

  it("handles EmailNotVerified", () => {
    expect(getSignInErrorMessage("EmailNotVerified")).toContain("verify your email");
  });

  it("handles OAuthAccountNotLinked", () => {
    expect(getSignInErrorMessage("OAuthAccountNotLinked")).toContain("different sign-in method");
  });

  it("handles CredentialsSignin fallback", () => {
    expect(getSignInErrorMessage("CredentialsSignin")).toContain("Sign in failed");
  });

  it("handles default unknown code", () => {
    expect(getSignInErrorMessage("SomeUnknownCode")).toContain("Unable to sign in");
  });
});

// Test for email domain validation
describe("Email Domain Validation", () => {
  const { z } = require("zod");

  const emailSchema = z.string()
    .email()
    .refine((email) => !email.toLowerCase().endsWith('.edu'), {
      message: "Educational email addresses (.edu) are not allowed at this time. Please use a personal email address."
    });

  it("accepts personal email addresses", () => {
    expect(() => emailSchema.parse("user@gmail.com")).not.toThrow();
    expect(() => emailSchema.parse("john.doe@outlook.com")).not.toThrow();
    expect(() => emailSchema.parse("test@protonmail.com")).not.toThrow();
  });

  it("rejects educational email addresses", () => {
    expect(() => emailSchema.parse("student@university.edu")).toThrow();
    expect(() => emailSchema.parse("professor@college.edu")).toThrow();
    expect(() => emailSchema.parse("admin@school.edu")).toThrow();
  });

  it("rejects invalid email formats", () => {
    expect(() => emailSchema.parse("invalid-email")).toThrow();
    expect(() => emailSchema.parse("")).toThrow();
  });

  it("handles case insensitive .edu detection", () => {
    expect(() => emailSchema.parse("student@UNIVERSITY.EDU")).toThrow();
    expect(() => emailSchema.parse("student@university.Edu")).toThrow();
  });
});


