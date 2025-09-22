import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "https://mental-health-nbvq2.ondigitalocean.app",
});

export const { useSession, signIn, signUp, signOut } = authClient;
