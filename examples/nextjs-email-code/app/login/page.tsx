"use client";

import { useAuth } from "@warpy-auth-sdk/core/hooks";

export default function LoginPage() {
  const { session, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (session) return <div>Already signed in!</div>;

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold">
            Sign in to your account
          </h2>
        </div>
        <div>
          <a
            href="/api/auth/signin/google"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Sign in with Google
          </a>
        </div>
      </div>
    </div>
  );
}
