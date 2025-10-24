import { Pool } from 'pg';
import Redis from 'ioredis';

// Test configuration
export const TEST_CONFIG = {
  database: {
    host: process.env.TEST_DB_HOST || 'localhost',
    port: parseInt(process.env.TEST_DB_PORT || '5432'),
    database: process.env.TEST_DB_NAME || 'booking_system_test',
    user: process.env.TEST_DB_USER || 'postgres',
    password: process.env.TEST_DB_PASSWORD || 'password',
  },
  redis: {
    host: process.env.TEST_REDIS_HOST || 'localhost',
    port: parseInt(process.env.TEST_REDIS_PORT || '6379'),
  },
  rabbitmq: {
    url: process.env.TEST_RABBITMQ_URL || 'amqp://localhost:5672',
  }
};

// Test utilities
export class TestUtils {
  static async clearDatabase(pool: Pool) {
    try {
      await pool.query('DELETE FROM bookings');
      await pool.query('DELETE FROM events');
    } catch (error) {
      console.log('Database clear error (normal in tests):', error);
    }
  }

  static async clearRedis(redis: Redis) {
    try {
      await redis.flushall();
    } catch (error) {
      console.log('Redis clear error (normal in tests):', error);
    }
  }

  static async createTestEvent(pool: Pool, name: string = 'Test Event', totalSeats: number = 10) {
    const result = await pool.query(
      'INSERT INTO events (name, total_seats) VALUES ($1, $2) RETURNING *',
      [name, totalSeats]
    );
    return result.rows[0];
  }

  static async createTestBooking(pool: Pool, eventId: number, userId: string) {
    const result = await pool.query(
      'INSERT INTO bookings (event_id, user_id) VALUES ($1, $2) RETURNING *',
      [eventId, userId]
    );
    return result.rows[0];
  }
}
