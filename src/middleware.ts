// Middleware disabled - using server components for authentication instead
export function middleware() {
  // No-op - authentication handled in server components
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - root path (/) - allow public access to homepage
     */
    "/((?!api|_next/static|_next/image|favicon.ico|$).*)",
  ],
};
