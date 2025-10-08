import { createSupabaseServerClient } from "~/core/adapters/auth/supabase-server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const error_description = searchParams.get("error_description");
  const redirectTo =
    searchParams.get("redirectTo") ?? searchParams.get("next") ?? "/";
  const forwardedHost = request.headers.get("x-forwarded-host"); // original origin before load balancer

  // Handle OAuth errors
  if (error) {
    const errorParam =
      error === "access_denied" ? "OAuthSignin" : (error_description ?? error);
    const redirectUrl = `/auth/signin?error=${encodeURIComponent(errorParam)}`;

    if (forwardedHost) {
      return NextResponse.redirect(`https://${forwardedHost}${redirectUrl}`);
    } else {
      return NextResponse.redirect(`${origin}${redirectUrl}`);
    }
  }

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${redirectTo}`);
      } else {
        return NextResponse.redirect(`${origin}${redirectTo}`);
      }
    }
    console.error(error, data);
  }

  // return the user to an error page with instructions
  const errorRedirectUrl = "/auth/signin?error=Callback";
  if (forwardedHost) {
    return NextResponse.redirect(`https://${forwardedHost}${errorRedirectUrl}`);
  }
  return NextResponse.redirect(`${origin}${errorRedirectUrl}`);
}
