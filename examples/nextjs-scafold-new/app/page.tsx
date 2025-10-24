"use client";

import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@auth-sdk/core/hooks";

export default function Home() {
  const { session, loading } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            Auth SDK Example
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            This is a Next.js 16 application with{" "}
            <span className="font-medium text-zinc-950 dark:text-zinc-50">
              auth-sdk
            </span>{" "}
            authentication. Sign in with Google or email magic link to access
            protected routes.
          </p>

          {loading ? (
            <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-zinc-600"></div>
              <span>Loading session...</span>
            </div>
          ) : session ? (
            <div className="flex flex-col gap-3 w-full max-w-md">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <p className="text-green-800 dark:text-green-200 font-medium">
                  Signed in as {session.user.email}
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-blue-800 dark:text-blue-200">
                You are not signed in. Sign in to access protected routes.
              </p>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
          {session ? (
            <>
              <Link
                className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px]"
                href="/dashboard"
              >
                Dashboard
              </Link>
              <Link
                className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
                href="/login"
              >
                Sign Out
              </Link>
            </>
          ) : (
            <>
              <Link
                className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px]"
                href="/login"
              >
                Sign In
              </Link>
              <a
                className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
                href="https://github.com/yourusername/auth-sdk"
                target="_blank"
                rel="noopener noreferrer"
              >
                Documentation
              </a>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
