"use client";
import * as React from "react";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { Session } from "../core";

export interface AuthContextValue {
  session: Session | null;
  loading: boolean;
  signIn: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export interface AuthProviderProps {
  children: ReactNode;
  secret: string;
  onSignIn?: (session: Session) => void;
  onSignOut?: () => void;
}

export function AuthProvider({
  children,
  secret,
  onSignIn,
  onSignOut,
}: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    try {
      setLoading(true);
      // In browser, we need to fetch from an API endpoint
      const response = await fetch("/api/auth/session");
      if (response.ok) {
        const data = await response.json();
        setSession(data.session || null);
      } else {
        setSession(null);
      }
    } catch (error) {
      console.error("Failed to fetch session:", error);
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const signIn = useCallback(
    async (email: string) => {
      try {
        // Call API to initiate sign-in
        const response = await fetch("/api/auth/signin/email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.session) {
            setSession(data.session);
            if (onSignIn) {
              onSignIn(data.session);
            }
          }
        }
      } catch (error) {
        console.error("Sign in failed:", error);
        throw error;
      }
    },
    [onSignIn]
  );

  const signOut = useCallback(async () => {
    try {
      await fetch("/api/auth/signout", { method: "POST" });
      setSession(null);
      if (onSignOut) {
        onSignOut();
      }
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  }, [onSignOut]);

  return (
    <AuthContext.Provider
      value={{ session, loading, signIn, signOut, refreshSession }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Server-side session helper
// server-side helper moved to hooks/server to avoid bundling server deps in client
