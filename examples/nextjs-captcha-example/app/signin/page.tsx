"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// Declare global grecaptcha type
declare global {
  interface Window {
    grecaptcha: {
      getResponse: () => string;
      reset: () => void;
      render: (element: string | HTMLElement, options: any) => number;
    };
  }
}

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);
  const [captchaLoaded, setCaptchaLoaded] = useState(false);

  // Get the site key from environment
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

  useEffect(() => {
    // Check if site key is available
    if (!siteKey) {
      console.error("NEXT_PUBLIC_RECAPTCHA_SITE_KEY is not set");
      setMessage({
        text: "CAPTCHA configuration error. Please set NEXT_PUBLIC_RECAPTCHA_SITE_KEY.",
        type: "error",
      });
      return;
    }

    // Load reCAPTCHA script
    const script = document.createElement("script");
    script.src = "https://www.google.com/recaptcha/api.js";
    script.async = true;
    script.defer = true;
    script.onload = () => setCaptchaLoaded(true);
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [siteKey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!captchaLoaded) {
      setMessage({
        text: "CAPTCHA not loaded yet. Please wait...",
        type: "error",
      });
      return;
    }

    const captchaToken = window.grecaptcha?.getResponse();

    if (!captchaToken) {
      setMessage({
        text: "Please complete the CAPTCHA challenge",
        type: "error",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/signin/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          captchaToken,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          text: "Magic link sent! Check your email inbox.",
          type: "success",
        });
        setEmail("");
        window.grecaptcha?.reset();
      } else {
        setMessage({
          text: data.error || "Failed to send magic link",
          type: "error",
        });
        window.grecaptcha?.reset();
      }
    } catch (error) {
      setMessage({
        text: "Network error. Please try again.",
        type: "error",
      });
      window.grecaptcha?.reset();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div className="mb-6">
          <span className="inline-block px-3 py-1 bg-indigo-600 text-white text-xs font-semibold rounded-full mb-4">
            reCAPTCHA v2
          </span>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Sign up with email
          </h1>
          <p className="text-gray-600 text-sm">
            Enter your email address to receive a magic link
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-600 transition-colors"
            />
          </div>

          {siteKey ? (
            <div className="flex justify-center">
              <div
                className="g-recaptcha"
                data-sitekey={siteKey}
              />
            </div>
          ) : (
            <div className="flex justify-center p-4 bg-red-50 text-red-700 rounded-lg text-sm">
              ⚠️ CAPTCHA configuration missing. Check your .env.local file.
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !captchaLoaded}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02]"
          >
            {loading ? "Sending..." : "Sign up with email"}
          </button>
        </form>

        {message && (
          <div
            className={`mt-4 p-4 rounded-lg ${
              message.type === "success"
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            <p className="text-sm">{message.text}</p>
          </div>
        )}

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Protected by reCAPTCHA. By signing up, you agree to our terms.
          </p>
        </div>
      </div>
    </div>
  );
}
