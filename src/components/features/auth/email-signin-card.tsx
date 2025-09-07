"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card, CardContent } from "~/components/ui/card";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "~/components/ui/input-otp";
import { Mail, Loader2 } from "lucide-react";
import { createSupabaseClientClient } from "~/adapters/auth/supabase-client";

interface EmailSignInCardProps {
  callbackUrl?: string;
}

export function EmailSignInCard({ callbackUrl }: EmailSignInCardProps) {
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [showOTPForm, setShowOTPForm] = useState(false);
  const [email, setEmail] = useState("");
  const [otp, setOTP] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setError(null);

    try {
      const supabase = createSupabaseClientClient();
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?redirectTo=${encodeURIComponent(callbackUrl ?? "/")}`,
        },
      });

      if (signInError) {
        setError(signInError.message);
      } else {
        setShowOTPForm(true);
        setShowEmailForm(false);
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (otpValue?: string) => {
    const codeToVerify = otpValue ?? otp;
    if (!codeToVerify || !email || codeToVerify.length !== 6) return;

    setIsVerifying(true);
    setError(null);

    try {
      const supabase = createSupabaseClientClient();
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: codeToVerify,
        type: "email",
      });

      if (verifyError) {
        setError(verifyError.message);
      } else {
        // Successfully verified - redirect to intended destination
        window.location.href = callbackUrl ?? "/";
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleOTPChange = (value: string) => {
    setOTP(value);
    // Auto-submit when 6 digits are entered
    if (value.length === 6 && !isVerifying) {
      void handleVerifyOTP(value);
    }
  };

  const handleBackToEmail = () => {
    setShowOTPForm(false);
    setOTP("");
    setError(null);
  };

  if (showOTPForm) {
    return (
      <Card className="border-gray-200 dark:border-gray-800">
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="text-muted-foreground h-5 w-5" />
                <Label className="inline-block text-base">
                  Enter the code sent to <strong>{email}</strong>
                </Label>
              </div>{" "}
              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={otp}
                  onChange={handleOTPChange}
                  disabled={isVerifying}
                >
                  {" "}
                  <InputOTPGroup>
                    {" "}
                    <InputOTPSlot index={0} /> <InputOTPSlot index={1} />{" "}
                    <InputOTPSlot index={2} /> <InputOTPSlot index={3} />{" "}
                    <InputOTPSlot index={4} /> <InputOTPSlot index={5} />{" "}
                  </InputOTPGroup>{" "}
                </InputOTP>{" "}
              </div>{" "}
              {isVerifying && (
                <div className="text-muted-foreground flex items-center justify-center gap-2 text-sm">
                  {" "}
                  <Loader2 className="h-4 w-4 animate-spin" /> Verifying
                  code...{" "}
                </div>
              )}{" "}
            </div>{" "}
            <div className="flex flex-col gap-2 text-center">
              {" "}
              <Button
                type="button"
                variant="link"
                size="sm"
                onClick={() =>
                  handleEmailSignIn({
                    preventDefault: () => {
                      /* noop */
                    },
                  } as React.FormEvent)
                }
                disabled={isLoading}
                className="text-sm"
              >
                {" "}
                {isLoading ? "Sending..." : "Resend code"}{" "}
              </Button>{" "}
              <Button
                type="button"
                variant="link"
                size="sm"
                onClick={handleBackToEmail}
                disabled={isVerifying}
                className="text-muted-foreground text-sm"
              >
                {" "}
                Use different email{" "}
              </Button>{" "}
            </div>{" "}
          </div>{" "}
        </CardContent>{" "}
      </Card>
    );
  }
  if (showEmailForm) {
    return (
      <Card className="border-gray-200 dark:border-gray-800">
        {" "}
        <CardContent className="space-y-4">
          {" "}
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
              {" "}
              {error}{" "}
            </div>
          )}{" "}
          <form onSubmit={handleEmailSignIn} className="space-y-4">
            {" "}
            <div className="flex items-center gap-3">
              {" "}
              <Mail className="text-muted-foreground h-5 w-5 flex-shrink-0" />{" "}
              <div className="flex-1 space-y-2">
                {" "}
                <Label htmlFor="email" className="text-base">
                  Email address
                </Label>{" "}
              </div>
            </div>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              required
              disabled={isLoading}
            />
            <Button
              type="submit"
              disabled={isLoading || !email}
              className="w-full"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Mail className="mr-2 h-4 w-4" />
              )}
              Send Code
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className="cursor-pointer border-gray-200 transition-colors hover:border-gray-300 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-950"
      onClick={() => setShowEmailForm(true)}
    >
      <CardContent className="flex items-center gap-4">
        <div className="flex-shrink-0">
          <Mail className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold">Email</h3>
        </div>
      </CardContent>
    </Card>
  );
}
