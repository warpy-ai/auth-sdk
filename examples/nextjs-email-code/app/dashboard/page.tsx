"use client";

import { useAuth } from "@warpy-auth-sdk/core/hooks";

export default function DashboardPage() {
  const { session, loading, signOut } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!session) return <div>Please sign in</div>;

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <button
            onClick={signOut}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Sign Out
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">
            Welcome, {session.user.name}!
          </h2>
          <p className="text-gray-600">Email: {session.user.email}</p>
          {session.user.picture && (
            <img
              src={session.user.picture}
              alt="Profile"
              className="w-16 h-16 rounded-full mt-4"
            />
          )}
        </div>
      </div>
    </div>
  );
}
