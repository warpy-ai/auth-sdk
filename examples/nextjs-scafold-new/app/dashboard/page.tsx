"use client";

import { useAuth } from "@warpy-auth-sdk/core/hooks";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardPage() {
  const auth = useAuth();
  const { session, loading } = auth;
  const signOutFn = auth.signOut;
  const router = useRouter();

  useEffect(() => {
    if (!loading && !session) {
      router.push("/login");
    }
  }, [session, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const handleSignOut = async () => {
    await signOutFn();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
            </div>
            <div className="flex items-center">
              <button
                onClick={handleSignOut}
                className="ml-4 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Welcome back!
            </h2>

            <div className="space-y-4">
              <div className="flex items-start">
                {session.user.picture && (
                  <img
                    src={session.user.picture}
                    alt={session.user.name || "User"}
                    className="h-16 w-16 rounded-full mr-4"
                  />
                )}
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {session.user.name || "User"}
                  </h3>
                  <p className="text-gray-600">{session.user.email}</p>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">
                  Session Information
                </h4>
                <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      User ID
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {session.user.id}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Session Type
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {session.type || "standard"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Expires
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {new Date(session.expires).toLocaleString()}
                    </dd>
                  </div>
                  {session.scopes && session.scopes.length > 0 && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Scopes
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {session.scopes.join(", ")}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">
                    ✅ Authentication Successful
                  </h4>
                  <p className="text-sm text-blue-700">
                    You are successfully authenticated using{" "}
                    <span className="font-semibold">auth-sdk</span>. This is a
                    protected page that requires authentication.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
