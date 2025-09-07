export type SignInErrorCode =
  | "MissingCredentials"
  | "UserNotFound"
  | "InvalidPassword"
  | "EmailNotVerified"
  | "OAuthAccountNotLinked"
  | "CredentialsSignin"
  | "TooManyRequests"
  | "Default";

export function getSignInErrorMessage(code?: string | null): string {
  const normalized = (code || "").trim();
  const lower = normalized.toLowerCase();

  // Handle wrapped/opaque errors coming from auth callbacks
  if (lower.includes("invalidpassword")) return "Incorrect email or password.";
  if (lower.includes("emailnotverified")) return "Please verify your email before signing in.";
  if (lower.includes("usernotfound")) return "No account found for that email. Please register first.";
  switch (normalized) {
    case "MissingCredentials":
      return "Please enter your email and password.";
    case "UserNotFound":
      return "No account found for that email. Please register first.";
    case "InvalidPassword":
      return "Incorrect email or password.";
    case "EmailNotVerified":
      return "Please verify your email before signing in.";
    case "OAuthAccountNotLinked":
      return "This email is linked to a different sign-in method.";
    case "CredentialsSignin":
      return "Sign in failed. Check your credentials.";
    case "CallbackRouteError":
      return "Sign in failed. Check your credentials.";
    case "TooManyRequests":
      return "Too many attempts. Please try again later.";
    case "":
    case undefined:
      return "";
    default:
      return "Unable to sign in. Please try again.";
  }
}


