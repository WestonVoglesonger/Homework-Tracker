import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user?: {
      id: string;
      isWaitlisted?: boolean;
      isAdmin?: boolean;
    } & DefaultSession["user"];
  }
}


