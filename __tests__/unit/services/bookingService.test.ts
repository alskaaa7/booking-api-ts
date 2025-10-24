// Мокаем все зависимости на верхнем уровне
jest.mock('../../../src/config/database', () => ({
  pool: {
    query: jest.fn(() => Promise.resolve({ rows: [] })),
    connect: jest.fn(() => Promise.resolve({
      query: jest.fn(() => Promise.resolve({ rows: [] })),
      release: jest.fn(),
    })),
  }
}));

jest.mock('../../../src/services/cacheService', () => ({
  cacheService: {
    hasUserBooking: jest.fn(() => Promise.resolve(false)),
    acquireLock: jest.fn(() => Promise.resolve(true)),
    releaseLock: jest.fn(() => Promise.resolve()),
    cacheUserBooking: jest.fn(() => Promise.resolve()),
    invalidateEventCache: jest.fn(() => Promise.resolve()),
    cacheBookedSeats: jest.fn(() => Promise.resolve()),
    getCachedBookedSeats: jest.fn(() => Promise.resolve(null)),
  }
}));

import { bookingService } from '../../../src/services/bookingService';
import { pool } from '../../../src/config/database';
import { cacheService } from '../../../src/services/cacheService';

const mockPool = pool as jest.Mocked<typeof pool>;
const mockCacheService = cacheService as jest.Mocked<typeof cacheService>;

describe('BookingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Моки по умолчанию
    (mockPool.query as jest.Mock).mockResolvedValue({ rows: [] });
    mockCacheService.hasUserBooking.mockResolvedValue(false);
    mockCacheService.acquireLock.mockResolvedValue(true);
  });

  describe('reserveBooking', () => {
    it('should successfully create booking', async () => {
      // Arrange
      const mockEvent = { 
        id: 1, 
        name: 'Test Event', 
        total_seats: 100,
        booked_seats: 50,
        available_seats: 50
      };
      
      const mockBooking = { 
        id: 1, 
        event_id: 1, 
        user_id: 'user123', 
        created_at: new Date() 
      };

      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [mockEvent] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ count: '50' }] })
        .mockResolvedValueOnce({ rows: [mockBooking] });

      // Act
      const result = await bookingService.reserveBooking({
        event_id: 1,
        user_id: 'user123'
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.booking).toEqual(mockBooking);
    });

    it('should return error when event not found', async () => {
      // Arrange
      (mockPool.query as jest.Mock).mockResolvedValue({ rows: [] });

      // Act
      const result = await bookingService.reserveBooking({
        event_id: 999,
        user_id: 'user123'
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Event not found');
    });
  });

  describe('getUserBookings', () => {
    it('should return user bookings', async () => {
      // Arrange
      const mockBookings = [
        { id: 1, event_id: 1, user_id: 'user123', created_at: new Date() }
      ];
      (mockPool.query as jest.Mock).mockResolvedValue({ rows: mockBookings });

      // Act
      const result = await bookingService.getUserBookings('user123');

      // Assert
      expect(result).toEqual(mockBookings);
    });
  });

  describe('cancelBooking', () => {
    it('should cancel booking successfully', async () => {
      // Arrange
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({}) // BEGIN
          .mockResolvedValueOnce({ rows: [{ event_id: 1 }] }) // DELETE
          .mockResolvedValueOnce({}), // COMMIT
        release: jest.fn()
      };
      
      (mockPool.connect as jest.Mock).mockResolvedValue(mockClient);

      // Act
      const result = await bookingService.cancelBooking(1, 'user123');

      // Assert
      expect(result).toBe(true);
      expect(mockClient.release).toHaveBeenCalled();
    });
  });
});
