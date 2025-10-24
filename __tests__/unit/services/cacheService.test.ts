import { cacheService } from '../../../src/services/cacheService';
import { redis } from '../../../src/config/redis';

jest.mock('../../../src/config/redis');

describe('CacheService', () => {
  let mockRedis: jest.Mocked<typeof redis>;

  beforeEach(() => {
    mockRedis = redis as jest.Mocked<typeof redis>;
    jest.clearAllMocks();
  });

  describe('cacheUserBooking', () => {
    it('should cache user booking with TTL', async () => {
      mockRedis.setex.mockResolvedValue('OK');

      await cacheService.cacheUserBooking(1, 'user123');

      expect(mockRedis.setex).toHaveBeenCalledWith(
        'booking:1:user123',
        300,
        '1'
      );
    });
  });

  describe('hasUserBooking', () => {
    it('should return true when booking exists in cache', async () => {
      mockRedis.get.mockResolvedValue('1');

      const result = await cacheService.hasUserBooking(1, 'user123');

      expect(result).toBe(true);
      expect(mockRedis.get).toHaveBeenCalledWith('booking:1:user123');
    });

    it('should return false when booking does not exist in cache', async () => {
      mockRedis.get.mockResolvedValue(null);

      const result = await cacheService.hasUserBooking(1, 'user123');

      expect(result).toBe(false);
    });
  });

  describe('cacheBookedSeats', () => {
    it('should cache booked seats count', async () => {
      mockRedis.setex.mockResolvedValue('OK');

      await cacheService.cacheBookedSeats(1, 5);

      expect(mockRedis.setex).toHaveBeenCalledWith(
        'event:1:booked_seats',
        300,
        '5'
      );
    });
  });

  describe('getCachedBookedSeats', () => {
    it('should return cached count when exists', async () => {
      mockRedis.get.mockResolvedValue('5');

      const result = await cacheService.getCachedBookedSeats(1);

      expect(result).toBe(5);
    });

    it('should return null when no cached data', async () => {
      mockRedis.get.mockResolvedValue(null);

      const result = await cacheService.getCachedBookedSeats(1);

      expect(result).toBe(null);
    });
  });

  describe('invalidateEventCache', () => {
    it('should delete all event-related cache keys', async () => {
      const mockKeys = ['event:1:booked_seats', 'event:1:other_data'];
      mockRedis.keys.mockResolvedValue(mockKeys);
      mockRedis.del.mockResolvedValue(2);

      await cacheService.invalidateEventCache(1);

      expect(mockRedis.keys).toHaveBeenCalledWith('event:1:*');
      expect(mockRedis.del).toHaveBeenCalledWith(...mockKeys);
    });

    it('should handle no keys found', async () => {
      mockRedis.keys.mockResolvedValue([]);

      await cacheService.invalidateEventCache(1);

      expect(mockRedis.del).not.toHaveBeenCalled();
    });
  });

  describe('lock operations', () => {
    it('should acquire lock successfully', async () => {
      mockRedis.set.mockResolvedValue('OK');

      const result = await cacheService.acquireLock('test-lock');

      expect(result).toBe(true);
      expect(mockRedis.set).toHaveBeenCalledWith(
        'test-lock',
        '1',
        'EX',
        10,
        'NX'
      );
    });

    it('should fail to acquire lock when already locked', async () => {
      mockRedis.set.mockResolvedValue(null);

      const result = await cacheService.acquireLock('test-lock');

      expect(result).toBe(false);
    });

    it('should release lock', async () => {
      mockRedis.del.mockResolvedValue(1);

      await cacheService.releaseLock('test-lock');

      expect(mockRedis.del).toHaveBeenCalledWith('test-lock');
    });
  });
});
