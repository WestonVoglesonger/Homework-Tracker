import NextAuth, { NextAuthOptions } from "next-auth";
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
          // Email verification bypassed - users can login immediately after registration
          // if (!user.emailVerified) {
          //   throw new Error("EmailNotVerified");
          // }
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
      async session({ session, token, user }) {
        if (session.user) {
          const id = (user as any)?.id || token?.sub || (token as any)?.id;
          if (id) session.user.id = id as string;
        }
        return session;
      },
    },
    pages: { signIn: "/auth/signin", error: "/auth/signin" },
  };

  const handler = NextAuth(authOptions);
  return { handler, authOptions };
}

export type { NextAuthOptions };


