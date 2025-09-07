import Link from "next/link";

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const params = await searchParams;
  
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="mx-auto max-w-md space-y-6 text-center">
        <h1 className="text-2xl font-bold">Authentication Error</h1>
        <p className="text-gray-600">
          {params.message ?? "An error occurred during authentication."}
        </p>
        <Link
          href="/"
          className="inline-block rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Return to Home
        </Link>
      </div>
    </div>
  );
}