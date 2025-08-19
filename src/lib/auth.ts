import NextAuth, { NextAuthOptions } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import CredentialsProvider from "next-auth/providers/credentials";

export async function getAuth() {
  const { PrismaAdapter } = await import("@next-auth/prisma-adapter");
  const { default: prisma } = await import("../db/client");

  const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    providers: [
      CredentialsProvider({
        name: "Credentials",
        credentials: {
          email: { label: "Email", type: "email" },
          password: { label: "Password", type: "password" },
        },
        async authorize(credentials) {
          if (!credentials?.email || !credentials?.password) return null;
          const { prisma: directPrisma } = await import("../db/client");
          const user = await directPrisma.user.findUnique({ where: { email: credentials.email } }) as any;
          if (!user?.passwordHash) return null;
          const { compare } = await import("bcryptjs");
          const ok = await compare(credentials.password, user.passwordHash);
          if (!ok) return null;
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
    pages: { signIn: "/auth/signin" },
  };

  const handler = NextAuth(authOptions);
  return { handler, authOptions };
}

export type { NextAuthOptions };


