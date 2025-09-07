import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { env } from "~/env";

export const supabaseServiceClient = createClient<Database>(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SECRET_KEY,
);
