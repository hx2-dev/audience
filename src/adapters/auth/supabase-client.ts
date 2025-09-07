import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "~/adapters/db/database.types";
import { env } from "~/env";

export function createSupabaseClientClient() {
  return createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}