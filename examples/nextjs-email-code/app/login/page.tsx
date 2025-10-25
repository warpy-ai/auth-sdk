"use client";

import { useState } from "react";
import { useAuth } from "@warpy-auth-sdk/core/hooks";

export default function Login2FAPage() {
  const { session, loading } = useAuth();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (loading) return <div>Loading...</div>;
  if (session) {
    window.location.href = "/dashboard";
    return <div>Redirecting...</div>;
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch(
        `/api/auth/signin/twofa?email=${encodeURIComponent(email)}`
      );

      console.log("Email send response:", {
        ok: response.ok,
        status: response.status,
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Email send data:", data);

        if (data.identifier) {
          setIdentifier(data.identifier);
          setStep("code");
          console.log("Switched to code step with identifier:", data.identifier);
        } else {
          setError("Failed to send verification code");
        }
      } else {
        const data = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        setError(data.error || "Failed to send verification code");
      }
    } catch (err) {
      console.error("Email send error:", err);
      setError("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    // Validate code before sending
    if (!code || code.length !== 6) {
      setError("Please enter a valid 6-digit code");
      setIsSubmitting(false);
      return;
    }

    try {
      const url = `/api/auth/signin/twofa?identifier=${encodeURIComponent(
        identifier
      )}&code=${encodeURIComponent(code)}`;
      console.log("Verifying code:", { identifier, code, url });

      const response = await fetch(url, {
        redirect: "follow", // Allow redirect to dashboard
      });

      console.log("Verify response:", {
        ok: response.ok,
        redirected: response.redirected,
        status: response.status,
      });

      // Check if successful - should have redirected to dashboard or returned success
      if (response.ok || response.redirected) {
        // Code verified successfully, redirect to dashboard
        window.location.href = "/dashboard";
      } else {
        const data = await response
          .json()
          .catch(() => ({ error: "Invalid verification code" }));
        setError(data.error || "Invalid verification code");
      }
    } catch (err) {
      console.error("Code verification error:", err);
      setError("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            {step === "email"
              ? "Sign in with Email"
              : "Enter Verification Code"}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {step === "email"
              ? "We'll send you a 6-digit code"
              : `Check your email at ${email}`}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {step === "email" ? (
          <form onSubmit={handleEmailSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="you@example.com"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Sending..." : "Send Verification Code"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleCodeSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="code"
                className="block text-sm font-medium text-gray-700"
              >
                Verification Code
              </label>
              <input
                id="code"
                name="code"
                type="text"
                required
                maxLength={6}
                pattern="[0-9]{6}"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-center text-2xl font-mono tracking-widest focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="000000"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting || code.length !== 6}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Verifying..." : "Verify Code"}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("email");
                setCode("");
                setIdentifier("");
              }}
              className="w-full text-sm text-blue-600 hover:text-blue-500"
            >
              Use a different email
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
