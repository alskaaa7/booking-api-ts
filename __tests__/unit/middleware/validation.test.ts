import { Request, Response, NextFunction } from 'express';
import { validateReserveBooking } from '../../../src/middleware/validation';

describe('Validation Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockRequest = {
      body: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
  });

  describe('validateReserveBooking', () => {
    it('should call next for valid request', () => {
      mockRequest.body = {
        event_id: 1,
        user_id: 'user123'
      };

      validateReserveBooking(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should return 400 for missing event_id', () => {
      mockRequest.body = {
        user_id: 'user123'
      };

      validateReserveBooking(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Valid event_id is required'
      });
    });

    it('should return 400 for invalid event_id type', () => {
      mockRequest.body = {
        event_id: 'invalid',
        user_id: 'user123'
      };

      validateReserveBooking(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Valid event_id is required'
      });
    });

    it('should return 400 for negative event_id', () => {
      mockRequest.body = {
        event_id: -1,
        user_id: 'user123'
      };

      validateReserveBooking(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Valid event_id is required'
      });
    });

    it('should return 400 for missing user_id', () => {
      mockRequest.body = {
        event_id: 1
      };

      validateReserveBooking(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Valid user_id is required'
      });
    });

    it('should return 400 for empty user_id', () => {
      mockRequest.body = {
        event_id: 1,
        user_id: ''
      };

      validateReserveBooking(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Valid user_id is required'
      });
    });

    it('should return 400 for non-string user_id', () => {
      mockRequest.body = {
        event_id: 1,
        user_id: 123
      };

      validateReserveBooking(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Valid user_id is required'
      });
    });
  });
});
