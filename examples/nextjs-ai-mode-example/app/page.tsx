'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import Link from 'next/link';

export default function HomePage() {
  const [searchParams, setSearchParams] = useState({
    from: 'JFK',
    to: 'LAX',
    departureDate: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    adults: 1,
    children: 0,
    infants: 0,
    cabinClass: 'Economy' as const,
    currency: 'USD',
  });

  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch('/api/flights/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(searchParams),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Search failed');
      }

      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const cheapestFlight = results?.results?.itineraries?.[0];
  const lowestPrice = cheapestFlight?.pricing_options?.[0]?.price?.amount;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-3xl">✈️</div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">FlightSearch AI</h1>
                <p className="text-sm text-gray-600">Powered by MCP & auth-sdk</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Link
                href="/dashboard"
                className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                Dashboard
              </Link>
              <Link
                href="/api/auth/signin/google"
                className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="mb-8 text-center">
          <h2 className="mb-4 text-4xl font-bold text-gray-900">
            Find Your Perfect Flight
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-600">
            Search thousands of flights with AI assistance. Our MCP-powered platform helps you find,
            track, and book the best flight deals.
          </p>
        </div>

        {/* Search Form */}
        <div className="mx-auto max-w-4xl rounded-2xl bg-white p-8 shadow-lg">
          <div className="mb-6 grid gap-6 md:grid-cols-2">
            {/* From */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">From</label>
              <input
                type="text"
                value={searchParams.from}
                onChange={(e) =>
                  setSearchParams({ ...searchParams, from: e.target.value.toUpperCase() })
                }
                placeholder="JFK"
                maxLength={3}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-lg font-semibold uppercase focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">Airport code (e.g., JFK, LAX, LHR)</p>
            </div>

            {/* To */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">To</label>
              <input
                type="text"
                value={searchParams.to}
                onChange={(e) =>
                  setSearchParams({ ...searchParams, to: e.target.value.toUpperCase() })
                }
                placeholder="LAX"
                maxLength={3}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-lg font-semibold uppercase focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">Airport code (e.g., JFK, LAX, LHR)</p>
            </div>

            {/* Date */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Departure Date</label>
              <input
                type="date"
                value={searchParams.departureDate}
                onChange={(e) =>
                  setSearchParams({ ...searchParams, departureDate: e.target.value })
                }
                min={format(new Date(), 'yyyy-MM-dd')}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Cabin Class */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Cabin Class</label>
              <select
                value={searchParams.cabinClass}
                onChange={(e) =>
                  setSearchParams({
                    ...searchParams,
                    cabinClass: e.target.value as any,
                  })
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Economy">Economy</option>
                <option value="Premium_Economy">Premium Economy</option>
                <option value="Business">Business</option>
                <option value="First">First Class</option>
              </select>
            </div>

            {/* Passengers */}
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-gray-700">Passengers</label>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs text-gray-600">Adults (18+)</label>
                  <input
                    type="number"
                    min={1}
                    max={9}
                    value={searchParams.adults}
                    onChange={(e) =>
                      setSearchParams({
                        ...searchParams,
                        adults: parseInt(e.target.value) || 1,
                      })
                    }
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-600">Children (2-17)</label>
                  <input
                    type="number"
                    min={0}
                    max={9}
                    value={searchParams.children}
                    onChange={(e) =>
                      setSearchParams({
                        ...searchParams,
                        children: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-600">Infants (0-2)</label>
                  <input
                    type="number"
                    min={0}
                    max={9}
                    value={searchParams.infants}
                    onChange={(e) =>
                      setSearchParams({
                        ...searchParams,
                        infants: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleSearch}
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 py-4 text-lg font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Searching Flights...' : 'Search Flights'}
          </button>
        </div>

        {/* Results */}
        {error && (
          <div className="mx-auto mt-6 max-w-4xl rounded-lg bg-red-50 p-4 text-red-800">
            <strong>Error:</strong> {error}
          </div>
        )}

        {results && (
          <div className="mx-auto mt-8 max-w-4xl">
            <div className="mb-4 rounded-lg bg-green-50 p-4">
              <h3 className="text-lg font-semibold text-green-900">
                ✅ Found {results.results.itineraries?.length || 0} Flight Options
              </h3>
              {lowestPrice && (
                <p className="text-green-800">
                  Starting from <strong>${lowestPrice.toFixed(2)} {searchParams.currency}</strong>
                </p>
              )}
            </div>

            <div className="rounded-lg bg-white p-6 shadow">
              <h4 className="mb-4 text-xl font-bold">Flight Results</h4>
              <pre className="overflow-x-auto rounded bg-gray-100 p-4 text-xs">
                {JSON.stringify(results.results, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </section>

      {/* MCP Info Section */}
      <section className="border-t bg-gray-50 py-12">
        <div className="mx-auto max-w-7xl px-4">
          <h3 className="mb-8 text-center text-2xl font-bold text-gray-900">
            Powered by MCP (Model Context Protocol)
          </h3>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-lg bg-white p-6 shadow">
              <div className="mb-3 text-3xl">🤖</div>
              <h4 className="mb-2 font-semibold">AI-Powered Search</h4>
              <p className="text-sm text-gray-600">
                AI agents can search flights on your behalf using our MCP tools.
              </p>
            </div>
            <div className="rounded-lg bg-white p-6 shadow">
              <div className="mb-3 text-3xl">🔒</div>
              <h4 className="mb-2 font-semibold">Secure Authentication</h4>
              <p className="text-sm text-gray-600">
                Protected by auth-sdk's MCP Shield with scoped access control.
              </p>
            </div>
            <div className="rounded-lg bg-white p-6 shadow">
              <div className="mb-3 text-3xl">📊</div>
              <h4 className="mb-2 font-semibold">Track & Book</h4>
              <p className="text-sm text-gray-600">
                Track flight prices and book directly through AI assistance.
              </p>
            </div>
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/mcp-demo"
              className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-6 py-3 font-medium text-white transition-colors hover:bg-purple-700"
            >
              <span>Try MCP Tools</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
