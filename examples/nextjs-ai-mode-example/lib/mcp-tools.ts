// MCP Tools for AI agent-delegated flight operations

import { z } from 'zod';
import { flightAPI, formatSearchParams } from './flightapi';
import { db, generateId } from './database';
import type {
  FlightSearchParams,
  User,
  TrackedFlight,
  FlightBooking,
  MockPayment,
  Passenger,
} from './types';

export interface MCPToolDefinition<T = unknown> {
  description: string;
  parameters: z.ZodObject<z.ZodRawShape>;
  execute: (args: T) => Promise<unknown>;
}

/**
 * Create MCP tools for flight operations
 * These tools can be called by AI agents with proper authentication
 */
export function createFlightMCPTools() {
  const tools = {
    search_flights: {
      description:
        'Search for one-way flights between two airports on a specific date',
      parameters: z.object({
        from: z
          .string()
          .length(3)
          .describe('Origin airport IATA code (e.g., HEL, JFK, LAX)'),
        to: z
          .string()
          .length(3)
          .describe('Destination airport IATA code (e.g., OUL, LHR, CDG)'),
        departureDate: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .describe('Departure date in YYYY-MM-DD format'),
        adults: z
          .number()
          .int()
          .min(1)
          .default(1)
          .describe('Number of adult passengers (18+ years)'),
        children: z
          .number()
          .int()
          .min(0)
          .default(0)
          .describe('Number of children (2-17 years)'),
        infants: z
          .number()
          .int()
          .min(0)
          .default(0)
          .describe('Number of infants (under 2 years)'),
        cabinClass: z
          .enum(['Economy', 'Business', 'First', 'Premium_Economy'])
          .default('Economy')
          .describe('Cabin class for the flight'),
        currency: z
          .string()
          .length(3)
          .default('USD')
          .describe('Currency code for prices (e.g., USD, EUR, GBP)'),
      }),
      execute: async (args: FlightSearchParams) => {
        try {
          console.log('[MCP] search_flights called:', formatSearchParams(args));

          const results = await flightAPI.searchOneWayFlights(args);

          // Calculate some useful stats
          const stats = {
            totalOptions: results.itineraries?.length || 0,
            carriers: new Set(
              results.carriers?.map(c => c.name) || []
            ).size,
            priceRange: {
              min: 0,
              max: 0,
              currency: args.currency,
            },
          };

          if (results.itineraries && results.itineraries.length > 0) {
            const prices = results.itineraries.flatMap(
              it =>
                it.pricing_options?.map(po => po.price.amount) || []
            );
            if (prices.length > 0) {
              stats.priceRange.min = Math.min(...prices);
              stats.priceRange.max = Math.max(...prices);
            }
          }

          return {
            success: true,
            searchParams: args,
            results,
            stats,
            message: `Found ${stats.totalOptions} flight options from ${stats.carriers} carriers. Prices range from ${stats.priceRange.min} to ${stats.priceRange.max} ${args.currency}.`,
          };
        } catch (error) {
          return {
            success: false,
            error:
              error instanceof Error
                ? error.message
                : 'Failed to search flights',
            searchParams: args,
          };
        }
      },
    } as MCPToolDefinition,

    track_flight: {
      description:
        'Track a specific flight itinerary for price changes and updates',
      parameters: z.object({
        userId: z.string().describe('User ID who is tracking the flight'),
        itineraryId: z.string().describe('Itinerary ID from search results'),
        searchParams: z
          .object({
            from: z.string(),
            to: z.string(),
            departureDate: z.string(),
            adults: z.number(),
            children: z.number(),
            infants: z.number(),
            cabinClass: z.string(),
            currency: z.string(),
          })
          .describe('Original search parameters'),
        initialPrice: z.number().describe('Initial price when tracked'),
        notifyOnPriceChange: z
          .boolean()
          .default(true)
          .describe('Whether to notify user on price changes'),
      }),
      execute: async (args: {
        userId: string;
        itineraryId: string;
        searchParams: FlightSearchParams;
        initialPrice: number;
        notifyOnPriceChange: boolean;
      }) => {
        try {
          console.log('[MCP] track_flight called for user:', args.userId);

          // Verify user exists
          const user = db.getUser(args.userId);
          if (!user) {
            return {
              success: false,
              error: 'User not found',
            };
          }

          const trackedFlight: TrackedFlight = {
            id: generateId('track'),
            userId: args.userId,
            itineraryId: args.itineraryId,
            searchParams: args.searchParams as FlightSearchParams,
            trackedAt: new Date(),
            notifyOnPriceChange: args.notifyOnPriceChange,
            initialPrice: args.initialPrice,
          };

          db.addTrackedFlight(trackedFlight);

          return {
            success: true,
            trackedFlight,
            message: `Flight ${args.searchParams.from} → ${args.searchParams.to} is now being tracked for user ${user.name || user.email}.`,
          };
        } catch (error) {
          return {
            success: false,
            error:
              error instanceof Error
                ? error.message
                : 'Failed to track flight',
          };
        }
      },
    } as MCPToolDefinition,

    get_user_info: {
      description: "Get a user's profile information",
      parameters: z.object({
        userId: z.string().describe('User ID to retrieve'),
      }),
      execute: async (args: { userId: string }) => {
        try {
          console.log('[MCP] get_user_info called for:', args.userId);

          const user = db.getUser(args.userId);
          if (!user) {
            return {
              success: false,
              error: 'User not found',
            };
          }

          // Don't expose sensitive data
          const safeUser = {
            id: user.id,
            email: user.email,
            name: user.name,
            picture: user.picture,
            phoneNumber: user.phoneNumber,
            hasPassport: !!user.passportNumber,
            memberSince: user.createdAt.toISOString(),
          };

          return {
            success: true,
            user: safeUser,
          };
        } catch (error) {
          return {
            success: false,
            error:
              error instanceof Error
                ? error.message
                : 'Failed to get user info',
          };
        }
      },
    } as MCPToolDefinition,

    update_user_info: {
      description: "Update a user's profile information",
      parameters: z.object({
        userId: z.string().describe('User ID to update'),
        name: z.string().optional().describe('Full name'),
        phoneNumber: z.string().optional().describe('Phone number'),
        dateOfBirth: z
          .string()
          .optional()
          .describe('Date of birth (YYYY-MM-DD)'),
        passportNumber: z.string().optional().describe('Passport number'),
      }),
      execute: async (args: {
        userId: string;
        name?: string;
        phoneNumber?: string;
        dateOfBirth?: string;
        passportNumber?: string;
      }) => {
        try {
          console.log('[MCP] update_user_info called for:', args.userId);

          const { userId, ...updates } = args;

          const updatedUser = db.updateUser(userId, updates);
          if (!updatedUser) {
            return {
              success: false,
              error: 'User not found',
            };
          }

          return {
            success: true,
            user: {
              id: updatedUser.id,
              email: updatedUser.email,
              name: updatedUser.name,
              phoneNumber: updatedUser.phoneNumber,
              dateOfBirth: updatedUser.dateOfBirth,
              hasPassport: !!updatedUser.passportNumber,
            },
            message: 'User information updated successfully',
          };
        } catch (error) {
          return {
            success: false,
            error:
              error instanceof Error
                ? error.message
                : 'Failed to update user info',
          };
        }
      },
    } as MCPToolDefinition,

    pay_for_flight: {
      description:
        'Process payment for a flight booking (mock payment system)',
      parameters: z.object({
        userId: z.string().describe('User ID making the payment'),
        itineraryId: z.string().describe('Itinerary ID to book'),
        searchParams: z
          .object({
            from: z.string(),
            to: z.string(),
            departureDate: z.string(),
            adults: z.number(),
            children: z.number(),
            infants: z.number(),
            cabinClass: z.string(),
            currency: z.string(),
          })
          .describe('Flight search parameters'),
        price: z.number().describe('Total price to pay'),
        currency: z.string().describe('Currency code'),
        paymentMethod: z
          .enum(['credit_card', 'paypal', 'mock'])
          .default('mock')
          .describe('Payment method'),
        passengers: z
          .array(
            z.object({
              firstName: z.string(),
              lastName: z.string(),
              dateOfBirth: z.string(),
              passportNumber: z.string().optional(),
              email: z.string().optional(),
              type: z.enum(['adult', 'child', 'infant']),
            })
          )
          .describe('Passenger information'),
      }),
      execute: async (args: {
        userId: string;
        itineraryId: string;
        searchParams: FlightSearchParams;
        price: number;
        currency: string;
        paymentMethod: 'credit_card' | 'paypal' | 'mock';
        passengers: Passenger[];
      }) => {
        try {
          console.log('[MCP] pay_for_flight called for user:', args.userId);

          // Verify user exists
          const user = db.getUser(args.userId);
          if (!user) {
            return {
              success: false,
              error: 'User not found',
            };
          }

          // Validate passenger count
          const adultPassengers = args.passengers.filter(
            p => p.type === 'adult'
          ).length;
          const childPassengers = args.passengers.filter(
            p => p.type === 'child'
          ).length;
          const infantPassengers = args.passengers.filter(
            p => p.type === 'infant'
          ).length;

          if (
            adultPassengers !== args.searchParams.adults ||
            childPassengers !== args.searchParams.children ||
            infantPassengers !== args.searchParams.infants
          ) {
            return {
              success: false,
              error:
                'Passenger count does not match search parameters',
            };
          }

          // Create booking
          const booking: FlightBooking = {
            id: generateId('booking'),
            userId: args.userId,
            itineraryId: args.itineraryId,
            searchParams: args.searchParams as FlightSearchParams,
            price: args.price,
            currency: args.currency,
            status: 'pending',
            paymentMethod: args.paymentMethod,
            bookedAt: new Date(),
            passengers: args.passengers,
          };

          db.createBooking(booking);

          // Create mock payment
          const payment: MockPayment = {
            id: generateId('payment'),
            userId: args.userId,
            bookingId: booking.id,
            amount: args.price,
            currency: args.currency,
            status: 'completed', // Mock payment always succeeds
            method: args.paymentMethod,
            createdAt: new Date(),
          };

          db.createPayment(payment);

          // Update booking status
          db.updateBookingStatus(booking.id, 'confirmed');

          return {
            success: true,
            booking: {
              ...booking,
              status: 'confirmed',
            },
            payment,
            message: `Flight booked successfully! Booking ID: ${booking.id}. Payment of ${args.price} ${args.currency} processed via ${args.paymentMethod}.`,
          };
        } catch (error) {
          return {
            success: false,
            error:
              error instanceof Error
                ? error.message
                : 'Failed to process payment',
          };
        }
      },
    } as MCPToolDefinition,
  };

  return tools;
}
