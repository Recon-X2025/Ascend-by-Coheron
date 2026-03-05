/**
 * NextAuth.js handler: Google OAuth, Prisma adapter, JWT sessions.
 * Used by the /api/auth/* handler and getServerSession in auth middleware.
 */

import type { AuthOptions } from "next-auth";
import GoogleProviderModule from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { getEnv } from "@/node/get-app-env";

const GoogleProvider =
  typeof GoogleProviderModule === "function"
    ? GoogleProviderModule
    : (GoogleProviderModule as { default: (opts: { clientId: string; clientSecret: string }) => unknown }).default;

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(getEnv().DB),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }) as AuthOptions["providers"][0],
  ],
  secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = (token.id ?? token.sub) as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
    error: "/",
  },
};
