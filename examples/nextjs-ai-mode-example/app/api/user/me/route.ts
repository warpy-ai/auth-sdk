// Get current user information
// GET /api/user/me

import { getSession } from '@warpy-auth-sdk/core/hooks/server';
import { db } from '@/lib/database';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const session = await getSession(request, process.env.AUTH_SECRET!);

    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get full user info from database
    const user = db.getUser(session.userId);

    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user's bookings and tracked flights
    const bookings = db.getUserBookings(user.id);
    const trackedFlights = db.getUserTrackedFlights(user.id);

    return Response.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        phoneNumber: user.phoneNumber,
        dateOfBirth: user.dateOfBirth,
        hasPassport: !!user.passportNumber,
        memberSince: user.createdAt,
      },
      stats: {
        bookings: bookings.length,
        trackedFlights: trackedFlights.length,
      },
    });
  } catch (error) {
    console.error('[User API] Error:', error);
    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Failed to get user',
      },
      { status: 500 }
    );
  }
}
