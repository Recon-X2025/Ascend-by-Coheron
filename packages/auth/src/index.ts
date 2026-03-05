/**
 * NextAuth configuration. Call createAuthOptions(db, env) from the API.
 */
import type { AuthOptions } from "next-auth";
import GoogleProviderModule from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import type { PrismaClient } from "@prisma/client";

const GoogleProvider =
  typeof GoogleProviderModule === "function"
    ? GoogleProviderModule
    : (GoogleProviderModule as { default: (opts: { clientId: string; clientSecret: string }) => AuthOptions["providers"][0] }).default;

export interface AuthEnv {
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  NEXTAUTH_SECRET?: string;
  AUTH_SECRET?: string;
}

export function createAuthOptions(db: PrismaClient, env: AuthEnv): AuthOptions {
  return {
    adapter: PrismaAdapter(db),
    providers: [
      GoogleProvider({
        clientId: env.GOOGLE_CLIENT_ID ?? "",
        clientSecret: env.GOOGLE_CLIENT_SECRET ?? "",
      }),
    ],
    secret: env.NEXTAUTH_SECRET ?? env.AUTH_SECRET,
    session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
    callbacks: {
      jwt({ token, user }) {
        if (user) token.id = user.id;
        return token;
      },
      session({ session, token }) {
        if (session.user) (session.user as { id?: string }).id = (token.id ?? token.sub) as string;
        return session;
      },
    },
    pages: { signIn: "/", error: "/" },
  };
}
