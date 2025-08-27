import { describe, it, expect } from "vitest";
import { getSignInErrorMessage } from "../authErrors";

describe("getSignInErrorMessage", () => {
  it("returns empty string for empty code", () => {
    expect(getSignInErrorMessage("")).toBe("");
    expect(getSignInErrorMessage(null as any)).toBe("");
    expect(getSignInErrorMessage(undefined as any)).toBe("");
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


