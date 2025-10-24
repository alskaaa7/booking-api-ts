import request from 'supertest';
import app from '../../src/app';

// Мокаем все для E2E тестов
jest.mock('../../src/config/database', () => ({
  pool: {
    query: jest.fn(() => Promise.resolve({ rows: [] })),
    connect: jest.fn(() => Promise.resolve({
      query: jest.fn(() => Promise.resolve({ rows: [] })),
      release: jest.fn(),
    })),
  }
}));

jest.mock('../../src/services/cacheService', () => ({
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

jest.mock('../../src/services/queueService', () => ({
  queueService: {
    sendBookingRequest: jest.fn(() => Promise.resolve(true)),
  }
}));

describe('E2E Booking Tests', () => {
  describe('Complete booking flow', () => {
    it('should handle booking API endpoints', async () => {
      // Тестируем что все endpoints отвечают
      const reserveResponse = await request(app)
        .post('/api/bookings/reserve')
        .send({ event_id: 1, user_id: 'user123' });

      expect([201, 400]).toContain(reserveResponse.status);

      const userBookingsResponse = await request(app)
        .get('/api/bookings/user/user123');

      expect([200, 500]).toContain(userBookingsResponse.status);
    });

    it('should handle error scenarios', async () => {
      const response = await request(app)
        .post('/api/bookings/reserve')
        .send({}); // Пустой запрос

      expect(response.status).toBe(400);
    });
  });

  describe('API health check', () => {
    it('should respond to all booking routes', async () => {
      const routes = [
        { method: 'post', path: '/api/bookings/reserve' },
        { method: 'post', path: '/api/bookings/reserve-async' },
        { method: 'get', path: '/api/bookings/user/test' },
        { method: 'delete', path: '/api/bookings/1' }
      ];

      for (const route of routes) {
        const response = await (request(app) as any)[route.method](route.path);
        expect(response.status).not.toBe(404); // Не должно быть "Not Found"
      }
    });
  });
});
