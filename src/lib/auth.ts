import NextAuth, { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { compare } from "bcryptjs";
import prisma from "../db/client";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("MissingCredentials");
        }

        // Normalize email for case-insensitive lookup
        const normalizedEmail = (credentials.email as string).toLowerCase().trim();
        const user = await prisma.user.findUnique({
          where: { email: normalizedEmail }
        });

        if (!user?.passwordHash) {
          throw new Error("UserNotFound");
        }

        const isValid = await compare(credentials.password as string, user.passwordHash);
        if (!isValid) {
          throw new Error("InvalidPassword");
        }

        // Require email verification for security
        if (!user.emailVerified) {
          throw new Error("EmailNotVerified");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: { token: import("next-auth/jwt").JWT; user?: { id?: string } | null }) {
      if (user?.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { isWaitlisted: true, isAdmin: true },
        });

        token.isWaitlisted = dbUser?.isWaitlisted ?? false;
        token.isAdmin = dbUser?.isAdmin ?? false;
      }
      return token;
    },
    async session({ session, token }: { session: import("next-auth").Session; token: import("next-auth/jwt").JWT }) {
      if (session?.user) {
        session.user.id = (token.sub as string) ?? undefined;
        session.user.isWaitlisted = Boolean(token.isWaitlisted);
        session.user.isAdmin = Boolean(token.isAdmin);
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/signin",
  },
} satisfies NextAuthConfig);

// Export authOptions for backward compatibility with API routes
export const authOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("MissingCredentials");
        }

        // Normalize email for case-insensitive lookup
        const normalizedEmail = (credentials.email as string).toLowerCase().trim();
        const user = await prisma.user.findUnique({
          where: { email: normalizedEmail }
        });

        if (!user?.passwordHash) {
          throw new Error("UserNotFound");
        }

        const isValid = await compare(credentials.password as string, user.passwordHash);
        if (!isValid) {
          throw new Error("InvalidPassword");
        }

        // Require email verification for security
        if (!user.emailVerified) {
          throw new Error("EmailNotVerified");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: { token: import("next-auth/jwt").JWT; user?: { id?: string } | null }) {
      if (user?.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { isWaitlisted: true, isAdmin: true },
        });

        token.isWaitlisted = dbUser?.isWaitlisted ?? false;
        token.isAdmin = dbUser?.isAdmin ?? false;
      }
      return token;
    },
    async session({ session, token }: { session: import("next-auth").Session; token: import("next-auth/jwt").JWT }) {
      if (session?.user) {
        session.user.id = (token.sub as string) ?? undefined;
        session.user.isWaitlisted = Boolean(token.isWaitlisted);
        session.user.isAdmin = Boolean(token.isAdmin);
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/signin",
  },
};


