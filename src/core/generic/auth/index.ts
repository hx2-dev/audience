import NextAuth from "next-auth";
import { cache } from "react";

import { authConfig } from "./config";

const { auth: uncachedAuth, handlers, signIn, signOut } = NextAuth(authConfig);

const auth = cache(uncachedAuth);

/**
 * Creates a signin URL with callbackUrl parameter
 * @param callbackUrl - The URL to redirect to after successful authentication
 * @returns The signin URL with callbackUrl parameter
 */
export function createSigninUrl(callbackUrl: string): string {
  const url = new URL(
    "/api/auth/signin",
    process.env.NEXTAUTH_URL ?? "http://localhost:3000",
  );
  url.searchParams.set("callbackUrl", callbackUrl);
  return url.toString();
}

export { auth, handlers, signIn, signOut };
