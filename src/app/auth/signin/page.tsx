import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Chrome, MessageSquare, ArrowLeft } from "lucide-react";
import { EmailSignInCard } from "~/components/features/auth/email-signin-card";

interface SignInPageProps {
  searchParams: Promise<{
    callbackUrl?: string;
    error?: string;
  }>;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const { callbackUrl, error } = await searchParams;

  const providers = [
    {
      id: "google",
      name: "Google",
      icon: Chrome,
      description: "Sign in with your Google account",
      className:
        "border-blue-200 hover:border-blue-300 hover:bg-blue-50 dark:border-blue-800 dark:hover:bg-blue-950",
    },
    {
      id: "discord",
      name: "Discord",
      icon: MessageSquare,
      description: "Sign in with your Discord account",
      className:
        "border-indigo-200 hover:border-indigo-300 hover:bg-indigo-50 dark:border-indigo-800 dark:hover:bg-indigo-950",
    },
  ] as const;

  return (
    <div className="flex min-h-full flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Error message */}
        {error && (
          <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
            <CardHeader>
              <CardTitle>Sign In</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-sm text-red-600 dark:text-red-400">
                {error === "OAuthSignin" &&
                  "There was an error signing in with your account."}
                {error === "OAuthCallback" &&
                  "There was an error processing your sign-in."}
                {error === "OAuthCreateAccount" &&
                  "Could not create account with this provider."}
                {error === "EmailCreateAccount" &&
                  "Could not create account with this email."}
                {error === "Callback" &&
                  "There was an error in the authentication callback."}
                {error === "OAuthAccountNotLinked" &&
                  "This account is linked to a different sign-in method."}
                {error === "EmailSignin" &&
                  "Check your email for the sign-in link."}
                {error === "CredentialsSignin" &&
                  "Invalid credentials provided."}
                {error === "SessionRequired" &&
                  "You must be signed in to access this page."}
                {![
                  "OAuthSignin",
                  "OAuthCallback",
                  "OAuthCreateAccount",
                  "EmailCreateAccount",
                  "Callback",
                  "OAuthAccountNotLinked",
                  "EmailSignin",
                  "CredentialsSignin",
                  "SessionRequired",
                ].includes(error) &&
                  "An unexpected error occurred during sign-in."}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Provider options */}
        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Choose your preferred authentication method
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              {providers.map((provider) => {
                const Icon = provider.icon;
                return (
                  <Link
                    key={provider.id}
                    href={`/auth/oauth?provider=${provider.id}&redirectTo=${encodeURIComponent(callbackUrl ?? "/")}`}
                    className="no-underline"
                  >
                    <Card
                      className={`cursor-pointer transition-colors ${provider.className}`}
                    >
                      <CardContent className="flex items-center gap-4">
                        <div className="flex-shrink-0">
                          <Icon className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{provider.name}</h3>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
              
              {/* Email sign-in component - only this needs client-side logic */}
              <EmailSignInCard callbackUrl={callbackUrl} />

              <div className="text-muted-foreground text-sm">
                <p>
                  By continuing, you agree to our{" "}
                  <Link
                    href="/legal/terms"
                    className="hover:text-foreground underline"
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/legal/privacy"
                    className="hover:text-foreground underline"
                  >
                    Privacy Policy
                  </Link>
                  .
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Back link */}
        {callbackUrl !== "/" && (
          <div className="text-center">
            <Link
              href={callbackUrl ?? "/"}
              className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to where you were
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
