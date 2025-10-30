// In-memory database for users, tracked flights, and bookings

import type { User, TrackedFlight, FlightBooking, MockPayment } from './types';

class InMemoryDatabase {
  private users: Map<string, User> = new Map();
  private trackedFlights: Map<string, TrackedFlight> = new Map();
  private bookings: Map<string, FlightBooking> = new Map();
  private payments: Map<string, MockPayment> = new Map();

  // User operations
  createUser(user: User): User {
    this.users.set(user.id, user);
    return user;
  }

  getUser(id: string): User | undefined {
    return this.users.get(id);
  }

  getUserByEmail(email: string): User | undefined {
    return Array.from(this.users.values()).find(u => u.email === email);
  }

  updateUser(id: string, updates: Partial<User>): User | null {
    const user = this.users.get(id);
    if (!user) return null;

    const updated = { ...user, ...updates, updatedAt: new Date() };
    this.users.set(id, updated);
    return updated;
  }

  getAllUsers(): User[] {
    return Array.from(this.users.values());
  }

  // Tracked flights operations
  addTrackedFlight(flight: TrackedFlight): TrackedFlight {
    this.trackedFlights.set(flight.id, flight);
    return flight;
  }

  getTrackedFlight(id: string): TrackedFlight | undefined {
    return this.trackedFlights.get(id);
  }

  getUserTrackedFlights(userId: string): TrackedFlight[] {
    return Array.from(this.trackedFlights.values()).filter(
      f => f.userId === userId
    );
  }

  removeTrackedFlight(id: string): boolean {
    return this.trackedFlights.delete(id);
  }

  getAllTrackedFlights(): TrackedFlight[] {
    return Array.from(this.trackedFlights.values());
  }

  // Booking operations
  createBooking(booking: FlightBooking): FlightBooking {
    this.bookings.set(booking.id, booking);
    return booking;
  }

  getBooking(id: string): FlightBooking | undefined {
    return this.bookings.get(id);
  }

  getUserBookings(userId: string): FlightBooking[] {
    return Array.from(this.bookings.values()).filter(
      b => b.userId === userId
    );
  }

  updateBookingStatus(
    id: string,
    status: FlightBooking['status']
  ): FlightBooking | null {
    const booking = this.bookings.get(id);
    if (!booking) return null;

    booking.status = status;
    this.bookings.set(id, booking);
    return booking;
  }

  getAllBookings(): FlightBooking[] {
    return Array.from(this.bookings.values());
  }

  // Payment operations
  createPayment(payment: MockPayment): MockPayment {
    this.payments.set(payment.id, payment);
    return payment;
  }

  getPayment(id: string): MockPayment | undefined {
    return this.payments.get(id);
  }

  getUserPayments(userId: string): MockPayment[] {
    return Array.from(this.payments.values()).filter(
      p => p.userId === userId
    );
  }

  updatePaymentStatus(
    id: string,
    status: MockPayment['status']
  ): MockPayment | null {
    const payment = this.payments.get(id);
    if (!payment) return null;

    payment.status = status;
    this.payments.set(id, payment);
    return payment;
  }

  // Database stats
  getStats() {
    return {
      users: this.users.size,
      trackedFlights: this.trackedFlights.size,
      bookings: this.bookings.size,
      payments: this.payments.size,
    };
  }

  // Clear all data (for testing)
  clearAll() {
    this.users.clear();
    this.trackedFlights.clear();
    this.bookings.clear();
    this.payments.clear();
  }
}

// Singleton instance
export const db = new InMemoryDatabase();

// Helper function to generate unique IDs
export function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
