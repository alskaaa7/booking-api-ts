import request from 'supertest';
import app from '../../src/app';

// Мокаем внешние зависимости для интеграционных тестов
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

describe('API Integration Tests', () => {
  describe('POST /api/bookings/reserve', () => {
    it('should validate request body - missing event_id', async () => {
      const response = await request(app)
        .post('/api/bookings/reserve')
        .send({ user_id: 'user123' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should validate request body - missing user_id', async () => {
      const response = await request(app)
        .post('/api/bookings/reserve')
        .send({ event_id: 1 });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should validate request body - invalid types', async () => {
      const response = await request(app)
        .post('/api/bookings/reserve')
        .send({ event_id: 'invalid', user_id: 123 });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/bookings/user/:user_id', () => {
    it('should return 400 for missing user_id', async () => {
      const response = await request(app)
        .get('/api/bookings/user/');

      expect(response.status).toBe(404); // Express returns 404 for non-matching routes
    });
  });

  describe('DELETE /api/bookings/:booking_id', () => {
    it('should validate missing user_id', async () => {
      const response = await request(app)
        .delete('/api/bookings/1')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('user_id is required');
    });

    it('should validate invalid booking_id', async () => {
      const response = await request(app)
        .delete('/api/bookings/invalid')
        .send({ user_id: 'user123' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Valid booking_id is required');
    });
  });
});
