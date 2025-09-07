import { cache } from "react";
import { getSession, getUser, signOut as supabaseSignOut, createSigninUrl as createSupabaseSigninUrl } from "./supabase-config";

// Cache the session for better performance
const auth = cache(getSession);

/**
 * Creates a signin URL that displays provider options
 * @param callbackUrl - The URL to redirect to after successful authentication
 * @returns The signin URL with callback parameter
 */
export function createSigninUrl(callbackUrl?: string): string {
  return createSupabaseSigninUrl(callbackUrl);
}

// Export Supabase auth functions
export { auth, getUser, supabaseSignOut as signOut };
