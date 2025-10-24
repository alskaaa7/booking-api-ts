import { pool } from '../config/database';
import { cacheService } from './cacheService';
import { Booking, ReserveBookingRequest, ReserveBookingResponse } from '../models/booking';
import { EventWithBookings } from '../models/event';

export class BookingService {
  async reserveBooking(request: ReserveBookingRequest): Promise<ReserveBookingResponse> {
    const { event_id, user_id } = request;
    const lockKey = `lock:event:${event_id}:user:${user_id}`;

    try {
      const event = await this.getEvent(event_id);
      if (!event) {
        return { success: false, error: 'Event not found' };
      }

      const hasCachedBooking = await cacheService.hasUserBooking(event_id, user_id);
      if (hasCachedBooking) {
        return { success: false, error: 'User already has a booking for this event' };
      }

      const lockAcquired = await cacheService.acquireLock(lockKey);
      if (!lockAcquired) {
        return { success: false, error: 'Another booking request is in progress' };
      }

      try {
        const existingBooking = await this.getUserBooking(event_id, user_id);
        if (existingBooking) {
          await cacheService.cacheUserBooking(event_id, user_id);
          return { success: false, error: 'User already has a booking for this event' };
        }

        const bookedSeats = await this.getBookedSeatsCount(event_id);
        if (bookedSeats >= event.total_seats) {
          return { success: false, error: 'No available seats for this event' };
        }

        const booking = await this.createBooking(event_id, user_id);
        await cacheService.cacheUserBooking(event_id, user_id);
        await cacheService.invalidateEventCache(event_id);

        return { success: true, booking };
      } finally {
        await cacheService.releaseLock(lockKey);
      }
    } catch (error) {
      console.error('Error in reserveBooking:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  async getEvent(eventId: number): Promise<EventWithBookings | null> {
    const query = `
      SELECT 
        e.*,
        COUNT(b.id) as booked_seats,
        e.total_seats - COUNT(b.id) as available_seats
      FROM events e
      LEFT JOIN bookings b ON e.id = b.event_id
      WHERE e.id = $1
      GROUP BY e.id
    `;
    const result = await pool.query(query, [eventId]);
    return result.rows[0] || null;
  }

  async getUserBooking(eventId: number, userId: string): Promise<Booking | null> {
    const query = 'SELECT * FROM bookings WHERE event_id = $1 AND user_id = $2';
    const result = await pool.query(query, [eventId, userId]);
    return result.rows[0] || null;
  }

  async getBookedSeatsCount(eventId: number): Promise<number> {
    const cachedCount = await cacheService.getCachedBookedSeats(eventId);
    if (cachedCount !== null) return cachedCount;

    const query = 'SELECT COUNT(*) as count FROM bookings WHERE event_id = $1';
    const result = await pool.query(query, [eventId]);
    const count = parseInt(result.rows[0].count, 10);
    await cacheService.cacheBookedSeats(eventId, count);
    return count;
  }

  async createBooking(eventId: number, userId: string): Promise<Booking> {
    const query = 'INSERT INTO bookings (event_id, user_id) VALUES ($1, $2) RETURNING *';
    const result = await pool.query(query, [eventId, userId]);
    return result.rows[0];
  }

  async getUserBookings(userId: string): Promise<Booking[]> {
    const query = `
      SELECT b.*, e.name as event_name 
      FROM bookings b
      JOIN events e ON b.event_id = e.id
      WHERE b.user_id = $1
      ORDER BY b.created_at DESC
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  async cancelBooking(bookingId: number, userId: string): Promise<boolean> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const deleteQuery = 'DELETE FROM bookings WHERE id = $1 AND user_id = $2 RETURNING event_id';
      const result = await client.query(deleteQuery, [bookingId, userId]);
      
      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        return false;
      }

      const eventId = result.rows[0].event_id;
      await cacheService.invalidateEventCache(eventId);
      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

export const bookingService = new BookingService();