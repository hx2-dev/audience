"use client";

import Link from "next/link";
import { useAuth } from "~/components/providers/supabase-auth-provider";
import { ThemeToggle } from "~/components/ui/theme-toggle";
import { Button } from "~/components/ui/button";
import { User, LogIn, LogOut } from "lucide-react";

export function AppFooter() {
  const { user, loading, signOut } = useAuth();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-background/95 supports-[backdrop-filter]:bg-background/60 mt-auto border-t backdrop-blur">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          {/* Left side - Theme and Auth */}
          <div className="flex flex-wrap items-center gap-4">
            <ThemeToggle />

            {loading ? (
              <div className="text-muted-foreground text-sm">Loading...</div>
            ) : user ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-muted-foreground flex items-center gap-1 text-sm">
                  <User className="h-4 w-4" />
                  <span className="break-words">
                    {user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email ?? "User"}
                  </span>
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => signOut()}
                  className="h-8 shrink-0 gap-1 px-2"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </Button>
              </div>
            ) : (
              <Link href="/auth/signin" className="no-underline">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 shrink-0 gap-1 px-2"
                >
                  <LogIn className="h-4 w-4" />
                  Sign in
                </Button>
              </Link>
            )}
          </div>

          {/* Right side - Links */}
          <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            <Link
              href="/legal/terms"
              className="hover:text-foreground whitespace-nowrap transition-colors"
            >
              Terms of Service
            </Link>
            <Link
              href="/legal/privacy"
              className="hover:text-foreground whitespace-nowrap transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="https://discord.gg/jMQ8gsF"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground whitespace-nowrap transition-colors"
            >
              Contact Us
            </Link>
            <span className="text-xs whitespace-nowrap">
              © {currentYear} HX2
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
