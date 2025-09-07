import { createSupabaseServerClient } from "~/adapters/auth/supabase-server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin: requestOrigin } = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host"); // original origin before load balancer
  const origin = forwardedHost ?? requestOrigin;
  const provider = searchParams.get("provider") as "google" | "discord";
  const redirectTo = searchParams.get("redirectTo") ?? "/";

  // If no provider specified, redirect to sign-in page
  if (!provider) {
    const signInUrl = new URL(`${origin}/auth/signin`);
    if (redirectTo !== "/") {
      signInUrl.searchParams.set("callbackUrl", redirectTo);
    }
    return NextResponse.redirect(signInUrl.toString());
  }

  if (!["google", "discord"].includes(provider)) {
    return NextResponse.redirect(
      `${origin}/auth/signin?error=Invalid provider&callbackUrl=${encodeURIComponent(redirectTo)}`,
    );
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `https://${origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
    },
  });

  if (error) {
    return NextResponse.redirect(
      `${origin}/auth/error?message=${encodeURIComponent(error.message)}`,
    );
  }

  return NextResponse.redirect(data.url);
}
