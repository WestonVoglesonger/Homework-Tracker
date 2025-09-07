import NextAuth, { NextAuthOptions, type Session, type User as NextAuthUser } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import CredentialsProvider from "next-auth/providers/credentials";

export async function getAuth() {
  const { PrismaAdapter } = await import("@next-auth/prisma-adapter");
  const { default: prisma } = await import("../db/client");

  const authOptions: NextAuthOptions = {
    secret: process.env.NEXTAUTH_SECRET,
    adapter: PrismaAdapter(prisma),
    providers: [
      CredentialsProvider({
        name: "Credentials",
        credentials: {
          email: { label: "Email", type: "email" },
          password: { label: "Password", type: "password" },
        },
        async authorize(credentials) {
          if (!credentials?.email || !credentials?.password) {
            throw new Error("MissingCredentials");
          }
          const { prisma: directPrisma } = await import("../db/client");
          // Normalize email for case-insensitive lookup
          const normalizedEmail = credentials.email.toLowerCase().trim();
          const user = await directPrisma.user.findUnique({ where: { email: normalizedEmail } }) as any;
          if (!user?.passwordHash) {
            throw new Error("UserNotFound");
          }
          const { compare } = await import("bcryptjs");
          const ok = await compare(credentials.password, user.passwordHash);
          if (!ok) {
            throw new Error("InvalidPassword");
          }
          // Require email verification for security
          if (!user.emailVerified) {
            throw new Error("EmailNotVerified");
          }
          return { id: user.id, email: user.email || undefined, name: user.name || undefined } as any;
        },
      }),
      ...(process.env.EMAIL_SERVER && process.env.EMAIL_FROM
        ? [
            EmailProvider({
              server: process.env.EMAIL_SERVER!,
              from: process.env.EMAIL_FROM!,
            }),
          ]
        : []),
    ],
    session: { strategy: "jwt" },
    callbacks: {
      async jwt({ token, user }): Promise<Record<string, unknown>> {
        try {
          // On first sign in, user will be present; otherwise rely on token.sub
          const userId = (user as NextAuthUser | undefined)?.id || token?.sub || (token as Record<string, unknown>)?.id;
          if (userId) {
            const dbUser = await prisma.user.findUnique({
              where: { id: String(userId) },
              select: { isWaitlisted: true, isAdmin: true },
            });
            (token as Record<string, unknown>).isWaitlisted = dbUser?.isWaitlisted ?? false;
            (token as Record<string, unknown>).isAdmin = dbUser?.isAdmin ?? false;
          }
        } catch {
          // If DB lookup fails, default to non-waitlisted, non-admin
          const t = token as Record<string, unknown>;
          t.isWaitlisted = t.isWaitlisted ?? false;
          t.isAdmin = t.isAdmin ?? false;
        }
        return token;
      },
      async session({ session, token, user }): Promise<Session> {
        if (session.user) {
          const id = (user as NextAuthUser | undefined)?.id || token?.sub || (token as Record<string, unknown>)?.id;
          if (id) session.user.id = String(id);
          // Propagate flags from token
          const t = token as Record<string, unknown>;
          (session.user as Record<string, unknown>).isWaitlisted = Boolean(t?.isWaitlisted);
          (session.user as Record<string, unknown>).isAdmin = Boolean(t?.isAdmin);
        }
        return session as Session;
      },
    },
    pages: { signIn: "/auth/signin", error: "/auth/signin" },
  };

  const handler = NextAuth(authOptions);
  return { handler, authOptions };
}

export type { NextAuthOptions };


