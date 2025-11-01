// Flight API Types based on FlightAPI.io documentation

export interface FlightSearchParams {
  from: string; // IATA code (e.g., 'HEL')
  to: string; // IATA code (e.g., 'OUL')
  departureDate: string; // YYYY-MM-DD
  adults: number;
  children: number;
  infants: number;
  cabinClass: 'Economy' | 'Business' | 'First' | 'Premium_Economy';
  currency: string; // ISO code (e.g., 'USD')
}

export interface FlightPrice {
  amount: number;
  update_status: 'current' | 'outdated';
  last_updated: string;
  quote_age: number;
}

export interface PricingOption {
  id: string;
  agent_ids: string[];
  price: FlightPrice;
  deepLink?: string;
}

export interface FlightItinerary {
  id: string;
  pricing_options: PricingOption[];
  leg_ids: string[];
}

export interface FlightLeg {
  id: string;
  origin_place_id: string;
  destination_place_id: string;
  departure: string; // ISO datetime
  arrival: string; // ISO datetime
  duration: number; // minutes
  stop_count: number;
  marketing_carrier_ids: string[];
  operating_carrier_ids: string[];
  segment_ids: string[];
}

export interface FlightSegment {
  id: string;
  origin_place_id: string;
  destination_place_id: string;
  departure: string;
  arrival: string;
  duration: number;
  marketing_flight_number: string;
  operating_flight_number: string;
  marketing_carrier_id: string;
  operating_carrier_id: string;
}

export interface Place {
  id: string;
  parent_id?: string;
  name: string;
  type: 'AIRPORT' | 'CITY' | 'COUNTRY';
  iata_code?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface Carrier {
  id: string;
  name: string;
  iata_code?: string;
  image_url?: string;
}

export interface Agent {
  id: string;
  name: string;
  type: 'AIRLINE' | 'TRAVEL_AGENT';
  image_url?: string;
}

export interface FlightSearchResponse {
  itineraries: FlightItinerary[];
  legs: FlightLeg[];
  segments: FlightSegment[];
  places: Place[];
  carriers: Carrier[];
  agents: Agent[];
}

// User database types
export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  createdAt: Date;
  updatedAt: Date;
  // Additional profile info
  phoneNumber?: string;
  dateOfBirth?: string;
  passportNumber?: string;
}

// Tracked flight types
export interface TrackedFlight {
  id: string;
  userId: string;
  itineraryId: string;
  searchParams: FlightSearchParams;
  trackedAt: Date;
  notifyOnPriceChange: boolean;
  initialPrice: number;
}

// Booking types
export interface FlightBooking {
  id: string;
  userId: string;
  itineraryId: string;
  searchParams: FlightSearchParams;
  price: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  paymentMethod: 'credit_card' | 'paypal' | 'mock';
  bookedAt: Date;
  passengers: Passenger[];
}

export interface Passenger {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  passportNumber?: string;
  email?: string;
  type: 'adult' | 'child' | 'infant';
}

// Payment types (mocked)
export interface MockPayment {
  id: string;
  userId: string;
  bookingId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  method: string;
  createdAt: Date;
}
