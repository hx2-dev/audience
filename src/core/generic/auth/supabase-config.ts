import { createSupabaseServerClient } from "~/core/adapters/auth/supabase-server";
import type { User } from "@supabase/supabase-js";

export interface AuthSession {
  user: {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
  };
}

export async function getSession(): Promise<AuthSession | null> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return {
    user: {
      id: user.id,
      email: user.email ?? "",
      name:
        (user.user_metadata?.full_name as string | undefined) ??
        (user.user_metadata?.name as string | undefined) ??
        null,
      image:
        (user.user_metadata?.avatar_url as string | undefined) ??
        (user.user_metadata?.picture as string | undefined) ??
        null,
    },
  };
}

export async function getUser(): Promise<User | null> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
}

export function createSigninUrl(callbackUrl?: string): string {
  const baseUrl = "/auth/signin";

  if (!callbackUrl) {
    return baseUrl;
  }

  return `${baseUrl}?callbackUrl=${encodeURIComponent(callbackUrl)}`;
}
