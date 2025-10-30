// Flight search API endpoint for UI
// POST /api/flights/search

import { flightAPI } from '@/lib/flightapi';
import type { FlightSearchParams } from '@/lib/types';
import { getSession } from '@warpy-auth-sdk/core/hooks/server';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    // Optional: Verify user is authenticated
    const session = await getSession(request, process.env.AUTH_SECRET!);

    const body = await request.json();
    const searchParams: FlightSearchParams = {
      from: body.from,
      to: body.to,
      departureDate: body.departureDate,
      adults: body.adults || 1,
      children: body.children || 0,
      infants: body.infants || 0,
      cabinClass: body.cabinClass || 'Economy',
      currency: body.currency || 'USD',
    };

    // Validate required fields
    if (!searchParams.from || !searchParams.to || !searchParams.departureDate) {
      return Response.json(
        { error: 'Missing required fields: from, to, departureDate' },
        { status: 400 }
      );
    }

    console.log('[Flight Search API] Searching flights:', searchParams);

    const results = await flightAPI.searchOneWayFlights(searchParams);

    return Response.json({
      success: true,
      searchParams,
      results,
      user: session ? { id: session.userId, email: session.email } : null,
    });
  } catch (error) {
    console.error('[Flight Search API] Error:', error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Search failed',
      },
      { status: 500 }
    );
  }
}
