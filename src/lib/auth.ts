import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email";

export async function getAuth() {
  const { PrismaAdapter } = await import("@next-auth/prisma-adapter");
  const { default: prisma } = await import("../db/client");

  const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    providers: [
      ...(process.env.EMAIL_SERVER && process.env.EMAIL_FROM
        ? [
            EmailProvider({
              server: process.env.EMAIL_SERVER!,
              from: process.env.EMAIL_FROM!,
            }),
          ]
        : []),
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID || "",
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      }),
    ],
    session: { strategy: "database" },
    callbacks: {
      async session({ session, user }) {
        if (session.user) {
          session.user.id = user.id as string;
        }
        return session;
      },
    },
    pages: {},
  };

  const handler = NextAuth(authOptions);
  return { handler, authOptions };
}

export type { NextAuthOptions };


