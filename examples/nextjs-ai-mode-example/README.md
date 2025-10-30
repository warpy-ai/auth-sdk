# FlightSearch AI - MCP Example with Next.js 16

A comprehensive flight search application demonstrating **Model Context Protocol (MCP)** integration with **auth-sdk's MCP Shield**. This example shows how to build a Skyscanner-like flight search platform where AI agents can securely search, track, and book flights on behalf of users.

## Features

### 🔍 Flight Search
- Search one-way flights using FlightAPI.io
- Support for multiple passengers (adults, children, infants)
- Multiple cabin classes (Economy, Premium Economy, Business, First)
- Real-time flight pricing and availability

### 🤖 MCP Integration
AI agents can perform the following operations through secured MCP tools:

1. **Flight Operations**
   - `search_flights` - Search for flights between airports
   - `track_flight` - Track flight prices for changes
   - `pay_for_flight` - Process mock payments for bookings

2. **User Operations**
   - `get_user_info` - Retrieve user profile
   - `update_user_info` - Update user details

3. **Authentication** (auth-sdk provided)
   - `agent_login` - Create short-lived agent tokens
   - `get_session` - Verify session information
   - `revoke_token` - Invalidate agent tokens

### 🔒 Security & Authentication
- **Google OAuth** authentication for users via auth-sdk
- **MCP Shield** protection for ALL MCP operations
- **Bearer token authentication** required for AI agents
- **Scoped access** control (search, read, write, payment, user, admin)
- **Short-lived tokens** (15-minute default expiration)
- **Token validation** on every protected tool request
- **In-memory database** for demo purposes

**Authentication Flow**:
1. AI agent calls `agent_login` (public tool - no auth needed)
2. Receives JWT token with specified scopes
3. Includes token in `Authorization: Bearer <token>` header
4. All other tools verify token before execution
5. Insufficient scopes = 403 Forbidden

### 💳 Mock Payment System
- Simulated payment processing
- Support for multiple payment methods
- Booking confirmation and tracking

## Tech Stack

- **Next.js 16** - React framework with Proxy support
- **TypeScript** - Type-safe development
- **Tailwind CSS 4** - Styling
- **auth-sdk** - Authentication and MCP Shield
- **FlightAPI.io** - Real flight data (30 requests limit)
- **date-fns** - Date utilities
- **Zod** - Schema validation

## Project Structure

```
nextjs-ai-mode-example/
├── app/
│   ├── api/
│   │   ├── mcp/
│   │   │   └── route.ts              # MCP tools endpoint
│   │   ├── flights/
│   │   │   └── search/route.ts       # Flight search API
│   │   └── user/
│   │       └── me/route.ts           # User profile API
│   ├── mcp-demo/
│   │   └── page.tsx                  # MCP tools demo page
│   ├── page.tsx                      # Main flight search page
│   └── layout.tsx                    # Root layout
├── lib/
│   ├── types.ts                      # TypeScript types
│   ├── database.ts                   # In-memory database
│   ├── flightapi.ts                  # FlightAPI client
│   └── mcp-tools.ts                  # MCP tool definitions
├── proxy.ts                          # Next.js 16 Proxy (auth routes)
└── .env.local                        # Environment variables
```

## Setup Instructions

### 1. Install Dependencies

```bash
bun install
# or
npm install
```

### 2. Configure Environment Variables

Create `.env.local` file:

```bash
# Auth SDK Configuration
AUTH_SECRET=your-super-secret-key-change-this-in-production-min-32-chars

# Google OAuth (required for authentication)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/callback/google

# FlightAPI.io (pre-configured)
FLIGHTAPI_KEY=69033dfa238bfcf37c297cf3

# Optional: Warpy Cloud API Key for MCP Shield
# WARPY_API_KEY=your-warpy-api-key
```

### 3. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
5. Copy Client ID and Client Secret to `.env.local`

### 4. Run Development Server

```bash
bun dev
# or
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Usage

### Flight Search (UI)

1. Navigate to homepage
2. Enter flight details:
   - Origin airport (IATA code, e.g., JFK)
   - Destination airport (IATA code, e.g., LAX)
   - Departure date
   - Number of passengers
   - Cabin class
3. Click "Search Flights"
4. View results with pricing

### MCP Tools Demo

1. Navigate to `/mcp-demo`
2. Select an MCP tool from dropdown
3. Fill in required parameters
4. Click "Execute" to see results

### Using MCP Tools Programmatically

⚠️ **IMPORTANT**: All MCP tools (except `agent_login`) require authentication via Bearer token.

#### Step 1: Agent Login (Get Authentication Token)

```bash
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "agent_login",
    "args": {
      "userId": "demo-user",
      "scopes": ["search", "read", "track", "write", "user", "payment"],
      "agentId": "claude-agent",
      "expiresIn": "15m"
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires": "2025-10-30T12:15:00Z"
}
```

**Save this token!** You'll need it for all subsequent requests.

#### Step 2: Search Flights with Authentication

```bash
# Replace YOUR_TOKEN_HERE with the token from Step 1
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "tool": "search_flights",
    "args": {
      "from": "JFK",
      "to": "LAX",
      "departureDate": "2025-11-15",
      "adults": 1,
      "children": 0,
      "infants": 0,
      "cabinClass": "Economy",
      "currency": "USD"
    }
  }'
```

**Without the token**, you'll get:
```json
{
  "error": "Authentication required",
  "message": "Missing Authorization header. Please authenticate using agent_login first."
}
```

#### Step 3: Track Flight

```bash
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "tool": "track_flight",
    "args": {
      "userId": "user-123",
      "itineraryId": "itin-abc123",
      "searchParams": {
        "from": "JFK",
        "to": "LAX",
        "departureDate": "2025-11-15",
        "adults": 1,
        "children": 0,
        "infants": 0,
        "cabinClass": "Economy",
        "currency": "USD"
      },
      "initialPrice": 299.99,
      "notifyOnPriceChange": true
    }
  }'
```

### List Available MCP Tools

```bash
curl http://localhost:3000/api/mcp
```

## FlightAPI.io Notes

### API Limits
- **30 requests total** for the provided API key
- Each successful request costs **2 credits**
- Plan your testing accordingly

### Supported Airports
Use IATA codes (3 letters):
- `JFK` - John F. Kennedy International Airport (New York)
- `LAX` - Los Angeles International Airport
- `LHR` - London Heathrow Airport
- `CDG` - Charles de Gaulle Airport (Paris)
- `HEL` - Helsinki-Vantaa Airport
- `OUL` - Oulu Airport

Full list: [IATA Airport Codes](https://www.iata.org/en/publications/directories/code-search/)

## Troubleshooting

### Common Issues

**1. FlightAPI returns error**
- Check API key is correct in `.env.local`
- Verify you haven't exceeded 30 request limit
- Ensure IATA codes are valid (3 letters)
- Check date is in future and valid format (YYYY-MM-DD)

**2. Google OAuth fails**
- Verify Client ID and Client Secret
- Check redirect URI matches exactly
- Ensure Google+ API is enabled
- Try clearing browser cookies

**3. MCP tools fail**
- Verify AUTH_SECRET is set (min 32 characters)
- Check tool name is correct (case-sensitive)
- Validate request body has `tool` and `args`
- Review server logs for detailed errors

**4. Database issues**
- Remember: in-memory database resets on server restart
- User data is lost when server stops
- For persistence, implement real database adapter

## Resources

- [MCP Authentication Guide](./MCP_AUTHENTICATION_GUIDE.md) - **Complete authentication flow documentation**
- [auth-sdk Documentation](https://github.com/warpy-ai/auth-sdk)
- [FlightAPI.io Docs](https://docs.flightapi.io/)
- [Next.js 16 Documentation](https://nextjs.org/docs)

---

**Built with ❤️ using auth-sdk and Model Context Protocol**
