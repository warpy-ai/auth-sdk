import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-700 p-4">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-white mb-4">
          Next.js CAPTCHA Example
        </h1>
        <p className="text-xl text-blue-100 mb-8">
          Authentication with CAPTCHA Protection
        </p>

        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Features
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="border border-gray-200 rounded-lg p-4 text-left">
              <div className="text-3xl mb-2">🛡️</div>
              <h3 className="font-semibold text-gray-900 mb-1">
                CAPTCHA Protection
              </h3>
              <p className="text-sm text-gray-600">
                reCAPTCHA v2 prevents bot attacks
              </p>
            </div>

            <div className="border border-gray-200 rounded-lg p-4 text-left">
              <div className="text-3xl mb-2">📧</div>
              <h3 className="font-semibold text-gray-900 mb-1">
                Magic Link Auth
              </h3>
              <p className="text-sm text-gray-600">
                Passwordless email authentication
              </p>
            </div>

            <div className="border border-gray-200 rounded-lg p-4 text-left">
              <div className="text-3xl mb-2">⚡</div>
              <h3 className="font-semibold text-gray-900 mb-1">
                Next.js 16
              </h3>
              <p className="text-sm text-gray-600">
                Built with latest Next.js Proxy
              </p>
            </div>

            <div className="border border-gray-200 rounded-lg p-4 text-left">
              <div className="text-3xl mb-2">🎨</div>
              <h3 className="font-semibold text-gray-900 mb-1">
                Modern UI
              </h3>
              <p className="text-sm text-gray-600">
                Beautiful Tailwind CSS design
              </p>
            </div>
          </div>

          <Link
            href="/signin"
            className="inline-block px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg"
          >
            Get Started →
          </Link>
        </div>

        <div className="mt-8">
          <p className="text-sm text-blue-100">
            Powered by{" "}
            <a
              href="https://github.com/warpy-ai/auth-sdk"
              className="underline hover:text-white"
              target="_blank"
              rel="noopener noreferrer"
            >
              @warpy-auth-sdk/core
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
