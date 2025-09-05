import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";
import { SessionProvider } from "next-auth/react";

import { TRPCReactProvider } from "~/trpc/react";
import { ThemeProvider } from "~/components/ui/theme-provider";
import { Toaster } from "~/components/ui/sonner";
import { AppFooter } from "~/components/ui/app-footer";

export const metadata: Metadata = {
  title: "hx2 Audience",
  description: "Join interactive events and engage with real-time activities",
  icons: [
    { rel: "icon", url: "/favicon.ico" },
    {
      rel: "manifest",
      url: "/site.webmanifest",
    },
    {
      rel: "apple-touch-icon",
      sizes: "180x180",
      url: "/apple-touch-icon.png",
    },
    {
      rel: "icon",
      type: "image/png",
      sizes: "32x32",
      url: "/favicon-32x32.png",
    },
    {
      rel: "icon",
      type: "image/png",
      sizes: "16x16",
      url: "/favicon-16x16.png",
    },
  ],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable}`} suppressHydrationWarning>
      <body className="bg-slate-50 dark:bg-slate-900">
        <SessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <div className="relative flex min-h-screen flex-col">
              {/* Dot Grid Background - scrolls with content but doesn't affect it */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_rgb(128_128_128_/_0.15)_2px,transparent_0)] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)] bg-[size:24px_24px] dark:bg-[radial-gradient(circle_at_1px_1px,_rgb(150_150_150_/_0.25)_2px,transparent_0)]" />

              {/* Content layer */}
              <div className="relative z-10 flex min-h-screen flex-col">
                <Toaster />
                <main className="flex-1">
                  <TRPCReactProvider>{children}</TRPCReactProvider>
                </main>
                <AppFooter />
              </div>
            </div>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
