"use client";

import { useState } from "react";
import Link from "next/link";

export default function MCPDemoPage() {
  const [tool, setTool] = useState("search_flights");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const [flightSearchArgs, setFlightSearchArgs] = useState({
    from: "JFK",
    to: "LAX",
    departureDate: "2025-11-15",
    adults: 1,
    children: 0,
    infants: 0,
    cabinClass: "Economy",
    currency: "USD",
  });

  const [userUpdateArgs, setUserUpdateArgs] = useState({
    userId: "user_example_123",
    name: "John Doe",
    phoneNumber: "+1234567890",
  });

  const executeTool = async () => {
    setLoading(true);
    setResult(null);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let args: any = {};

      switch (tool) {
        case "search_flights":
          args = flightSearchArgs;
          break;
        case "get_user_info":
          args = { userId: "user_example_123" };
          break;
        case "update_user_info":
          args = userUpdateArgs;
          break;
        case "agent_login":
          args = {
            userId: "demo-user",
            scopes: ["search", "track"],
            agentId: "demo-agent",
            expiresIn: "15m",
          };
          break;
        default:
          args = {};
      }

      const response = await fetch("/api/mcp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool, args }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <span>←</span>
              <span>Back to Home</span>
            </Link>
            <h1 className="text-xl font-bold">MCP Tools Demo</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="mb-8 rounded-lg bg-blue-50 p-6">
          <h2 className="mb-2 text-2xl font-bold text-blue-900">
            Model Context Protocol (MCP) Demo
          </h2>
          <p className="text-blue-800">
            This page demonstrates the MCP tools available for AI agents. These
            tools are protected by auth-sdk&apos;s MCP Shield and can be called
            by AI assistants like Claude or ChatGPT.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Tool Selection & Form */}
          <div className="space-y-6">
            <div className="rounded-lg bg-white p-6 shadow">
              <h3 className="mb-4 text-lg text-black font-bold">
                Select MCP Tool
              </h3>
              <select
                value={tool}
                onChange={(e) => setTool(e.target.value)}
                className="w-full rounded-lg text-black border border-gray-300 px-4 py-2"
              >
                <optgroup label="Flight Operations">
                  <option value="search_flights">search_flights</option>
                  <option value="track_flight">track_flight</option>
                  <option value="pay_for_flight">pay_for_flight</option>
                </optgroup>
                <optgroup label="User Operations">
                  <option value="get_user_info">get_user_info</option>
                  <option value="update_user_info">update_user_info</option>
                </optgroup>
                <optgroup label="Auth Operations">
                  <option value="agent_login">agent_login</option>
                  <option value="get_session">get_session</option>
                  <option value="revoke_token">revoke_token</option>
                </optgroup>
              </select>
            </div>

            {/* Tool-specific forms */}
            {tool === "search_flights" && (
              <div className="rounded-lg bg-white p-6 shadow">
                <h4 className="mb-4 font-semibold text-black">
                  Search Flights Parameters
                </h4>
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm text-black">
                        From (IATA)
                      </label>
                      <input
                        type="text"
                        value={flightSearchArgs.from}
                        onChange={(e) =>
                          setFlightSearchArgs({
                            ...flightSearchArgs,
                            from: e.target.value.toUpperCase(),
                          })
                        }
                        maxLength={3}
                        className="w-full rounded border text-black px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm text-black">
                        To (IATA)
                      </label>
                      <input
                        type="text"
                        value={flightSearchArgs.to}
                        onChange={(e) =>
                          setFlightSearchArgs({
                            ...flightSearchArgs,
                            to: e.target.value.toUpperCase(),
                          })
                        }
                        maxLength={3}
                        className="w-full rounded border text-black px-3 py-2"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm text-black">
                      Departure Date
                    </label>
                    <input
                      type="date"
                      value={flightSearchArgs.departureDate}
                      onChange={(e) =>
                        setFlightSearchArgs({
                          ...flightSearchArgs,
                          departureDate: e.target.value,
                        })
                      }
                      className="w-full rounded border text-black px-3 py-2"
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <label className="mb-1 block text-sm text-black">
                        Adults
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={flightSearchArgs.adults}
                        onChange={(e) =>
                          setFlightSearchArgs({
                            ...flightSearchArgs,
                            adults: parseInt(e.target.value) || 1,
                          })
                        }
                        className="w-full rounded border text-black px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm text-black">
                        Children
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={flightSearchArgs.children}
                        onChange={(e) =>
                          setFlightSearchArgs({
                            ...flightSearchArgs,
                            children: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-full rounded border text-black px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm text-black">
                        Infants
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={flightSearchArgs.infants}
                        onChange={(e) =>
                          setFlightSearchArgs({
                            ...flightSearchArgs,
                            infants: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-full rounded border text-black px-3 py-2"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {tool === "update_user_info" && (
              <div className="rounded-lg bg-white p-6 shadow">
                <h4 className="mb-4 font-semibold text-black">
                  Update User Info Parameters
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm">User ID</label>
                    <input
                      type="text"
                      value={userUpdateArgs.userId}
                      onChange={(e) =>
                        setUserUpdateArgs({
                          ...userUpdateArgs,
                          userId: e.target.value,
                        })
                      }
                      className="w-full rounded border px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm">Name</label>
                    <input
                      type="text"
                      value={userUpdateArgs.name}
                      onChange={(e) =>
                        setUserUpdateArgs({
                          ...userUpdateArgs,
                          name: e.target.value,
                        })
                      }
                      className="w-full rounded border px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm">Phone Number</label>
                    <input
                      type="tel"
                      value={userUpdateArgs.phoneNumber}
                      onChange={(e) =>
                        setUserUpdateArgs({
                          ...userUpdateArgs,
                          phoneNumber: e.target.value,
                        })
                      }
                      className="w-full rounded border px-3 py-2"
                    />
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={executeTool}
              disabled={loading}
              className="w-full rounded-lg bg-purple-600 py-3 font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? "Executing..." : `Execute ${tool}`}
            </button>
          </div>

          {/* Results */}
          <div>
            <div className="rounded-lg bg-white p-6 shadow">
              <h3 className="mb-4 text-lg font-bold text-black">Response</h3>
              {result ? (
                <div>
                  {result.success ? (
                    <div className="mb-4 rounded bg-green-50 p-3 text-green-800">
                      ✅ Success
                    </div>
                  ) : (
                    <div className="mb-4 rounded bg-red-50 p-3 text-red-800">
                      ❌ Error: {result.error}
                    </div>
                  )}
                  <pre className="overflow-x-auto rounded bg-gray-100 p-4 text-xs">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              ) : (
                <p className="text-gray-500 text-black">
                  No results yet. Execute a tool to see the response.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Available Tools Documentation */}
        <div className="mt-12">
          <h3 className="mb-6 text-2xl font-bold text-black">
            Available MCP Tools
          </h3>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                name: "search_flights",
                description: "Search for one-way flights between two airports",
                category: "Flight Operations",
              },
              {
                name: "track_flight",
                description: "Track a specific flight for price changes",
                category: "Flight Operations",
              },
              {
                name: "pay_for_flight",
                description: "Process payment for a flight booking (mock)",
                category: "Flight Operations",
              },
              {
                name: "get_user_info",
                description: "Get user profile information",
                category: "User Operations",
              },
              {
                name: "update_user_info",
                description: "Update user profile information",
                category: "User Operations",
              },
              {
                name: "agent_login",
                description: "Create short-lived JWT for AI agent access",
                category: "Auth Operations",
              },
            ].map((tool) => (
              <div
                key={tool.name}
                className="rounded-lg border border-gray-200 bg-white p-4"
              >
                <div className="mb-2 text-xs font-medium text-purple-600 ">
                  {tool.category}
                </div>
                <h4 className="mb-2 font-mono text-sm font-semibold text-black">
                  {tool.name}
                </h4>
                <p className="text-sm text-gray-600 ">{tool.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
