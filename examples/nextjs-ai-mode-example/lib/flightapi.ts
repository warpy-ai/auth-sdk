// FlightAPI.io client

import type { FlightSearchParams, FlightSearchResponse } from './types';

const FLIGHTAPI_BASE_URL = 'https://api.flightapi.io';
const API_KEY = process.env.FLIGHTAPI_KEY;

if (!API_KEY) {
  console.warn('FLIGHTAPI_KEY is not set in environment variables');
}

export class FlightAPIClient {
  private apiKey: string;

  constructor(apiKey: string = API_KEY || '') {
    this.apiKey = apiKey;
  }

  /**
   * Search for one-way flights
   * API docs: https://docs.flightapi.io/flight-price-api/oneway-trip-api
   * Cost: 2 credits per request
   */
  async searchOneWayFlights(
    params: FlightSearchParams
  ): Promise<FlightSearchResponse> {
    const {
      from,
      to,
      departureDate,
      adults,
      children,
      infants,
      cabinClass,
      currency,
    } = params;

    // Build URL with path parameters
    const url = `${FLIGHTAPI_BASE_URL}/onewaytrip/${this.apiKey}/${from}/${to}/${departureDate}/${adults}/${children}/${infants}/${cabinClass}/${currency}`;

    console.log(`[FlightAPI] Searching flights: ${from} → ${to} on ${departureDate}`);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `FlightAPI error: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      const data: FlightSearchResponse = await response.json();

      console.log(
        `[FlightAPI] Found ${data.itineraries?.length || 0} flight options`
      );

      return data;
    } catch (error) {
      console.error('[FlightAPI] Search failed:', error);
      throw error;
    }
  }

  /**
   * Get flight details by itinerary ID
   * (Mock implementation - FlightAPI doesn't have a dedicated endpoint for this)
   */
  async getFlightDetails(itineraryId: string): Promise<any> {
    // In a real app, you'd search again or cache results
    throw new Error('Not implemented: Use searchOneWayFlights and filter results');
  }
}

// Singleton instance
export const flightAPI = new FlightAPIClient();

// Helper to format flight search params for display
export function formatSearchParams(params: FlightSearchParams): string {
  const passengers = [
    params.adults > 0 && `${params.adults} adult${params.adults > 1 ? 's' : ''}`,
    params.children > 0 && `${params.children} child${params.children > 1 ? 'ren' : ''}`,
    params.infants > 0 && `${params.infants} infant${params.infants > 1 ? 's' : ''}`,
  ]
    .filter(Boolean)
    .join(', ');

  return `${params.from} → ${params.to} | ${params.departureDate} | ${passengers} | ${params.cabinClass}`;
}

// Helper to find cheapest flight
export function findCheapestFlight(response: FlightSearchResponse): {
  itinerary: any;
  price: number;
} | null {
  if (!response.itineraries || response.itineraries.length === 0) {
    return null;
  }

  let cheapest: any = null;
  let lowestPrice = Infinity;

  for (const itinerary of response.itineraries) {
    if (!itinerary.pricing_options || itinerary.pricing_options.length === 0) {
      continue;
    }

    for (const option of itinerary.pricing_options) {
      if (option.price.amount < lowestPrice) {
        lowestPrice = option.price.amount;
        cheapest = { itinerary, pricingOption: option };
      }
    }
  }

  return cheapest
    ? { itinerary: cheapest.itinerary, price: lowestPrice }
    : null;
}
