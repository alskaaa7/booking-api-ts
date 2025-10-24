import { redis } from '../config/redis';

export class CacheService {
  private readonly BOOKING_KEY_PREFIX = 'booking:';
  private readonly EVENT_KEY_PREFIX = 'event:';
  private readonly CACHE_TTL = 300;

  async cacheUserBooking(eventId: number, userId: string): Promise<void> {
    const key = `${this.BOOKING_KEY_PREFIX}${eventId}:${userId}`;
    await redis.setex(key, this.CACHE_TTL, '1');
  }

  async hasUserBooking(eventId: number, userId: string): Promise<boolean> {
    const key = `${this.BOOKING_KEY_PREFIX}${eventId}:${userId}`;
    const result = await redis.get(key);
    return result === '1';
  }

  async cacheBookedSeats(eventId: number, count: number): Promise<void> {
    const key = `${this.EVENT_KEY_PREFIX}${eventId}:booked_seats`;
    await redis.setex(key, this.CACHE_TTL, count.toString());
  }

  async getCachedBookedSeats(eventId: number): Promise<number | null> {
    const key = `${this.EVENT_KEY_PREFIX}${eventId}:booked_seats`;
    const result = await redis.get(key);
    return result ? parseInt(result, 10) : null;
  }

  async invalidateEventCache(eventId: number): Promise<void> {
    const pattern = `${this.EVENT_KEY_PREFIX}${eventId}:*`;
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }

  async acquireLock(lockKey: string, ttl: number = 10): Promise<boolean> {
    const result = await redis.set(lockKey, '1', 'EX', ttl, 'NX');
    return result === 'OK';
  }

  async releaseLock(lockKey: string): Promise<void> {
    await redis.del(lockKey);
  }
}

export const cacheService = new CacheService();