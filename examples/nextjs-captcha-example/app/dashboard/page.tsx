"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Session {
  user: {
    id: string;
    email: string;
    name?: string;
    picture?: string;
  };
  expires: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSession() {
      try {
        const response = await fetch("/api/auth/session");
        if (response.ok) {
          const data = await response.json();
          if (data.session) {
            setSession(data.session);
          } else {
            router.push("/signin");
          }
        } else {
          router.push("/signin");
        }
      } catch (error) {
        console.error("Failed to fetch session:", error);
        router.push("/signin");
      } finally {
        setLoading(false);
      }
    }

    fetchSession();
  }, [router]);

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/signout", { method: "POST" });
      router.push("/signin");
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
            </div>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Welcome! 🎉
          </h2>
          <p className="text-gray-600 mb-6">
            You've successfully signed in with CAPTCHA protection.
          </p>

          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <h3 className="font-semibold text-indigo-900 mb-2">
              Your Session
            </h3>
            <dl className="space-y-2">
              <div>
                <dt className="text-sm text-indigo-700 font-medium">Email:</dt>
                <dd className="text-sm text-indigo-900">{session.user.email}</dd>
              </div>
              <div>
                <dt className="text-sm text-indigo-700 font-medium">User ID:</dt>
                <dd className="text-sm text-indigo-900 font-mono">
                  {session.user.id}
                </dd>
              </div>
              {session.user.name && (
                <div>
                  <dt className="text-sm text-indigo-700 font-medium">Name:</dt>
                  <dd className="text-sm text-indigo-900">
                    {session.user.name}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            CAPTCHA Protection Enabled ✓
          </h3>
          <p className="text-gray-600 mb-4">
            This application is protected with reCAPTCHA v2 to prevent bot
            attacks and automated sign-ups.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="text-3xl mb-2">🛡️</div>
              <h4 className="font-semibold text-gray-900 mb-1">Bot Protected</h4>
              <p className="text-sm text-gray-600">
                CAPTCHA verification prevents automated attacks
              </p>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="text-3xl mb-2">🔒</div>
              <h4 className="font-semibold text-gray-900 mb-1">Secure Auth</h4>
              <p className="text-sm text-gray-600">
                Magic links with server-side verification
              </p>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="text-3xl mb-2">⚡</div>
              <h4 className="font-semibold text-gray-900 mb-1">Next.js 16</h4>
              <p className="text-sm text-gray-600">
                Built with the latest Next.js features
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
