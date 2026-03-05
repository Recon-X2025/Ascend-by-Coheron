import { createAuthOptions } from "@ascend/auth";
import { prisma } from "./db/prisma.js";

export const authOptions = createAuthOptions(prisma, {
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  AUTH_SECRET: process.env.AUTH_SECRET,
});
