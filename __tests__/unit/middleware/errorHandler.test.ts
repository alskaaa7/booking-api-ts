import { Request, Response, NextFunction } from 'express';
import { errorHandler, asyncHandler, CustomError } from '../../../src/middleware/errorHandler';

describe('Error Handler Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('errorHandler', () => {
    it('should handle generic errors with 500 status', () => {
      const error = new Error('Something went wrong');

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Something went wrong'
      });
    });

    it('should use custom status code when provided', () => {
      const error: CustomError = new Error('Not found');
      error.statusCode = 404;

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Not found'
      });
    });

    it('should include stack trace in development', () => {
      process.env.NODE_ENV = 'development';
      const error = new Error('Test error');

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Test error',
        stack: error.stack
      });

      process.env.NODE_ENV = 'test';
    });
  });

  describe('asyncHandler', () => {
    it('should call next with error when async function throws', async () => {
      const error = new Error('Async error');
      const asyncFn = jest.fn().mockRejectedValue(error);

      const wrappedHandler = asyncHandler(asyncFn);
      
      await wrappedHandler(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should not call next when async function succeeds', async () => {
      const asyncFn = jest.fn().mockResolvedValue('success');

      const wrappedHandler = asyncHandler(asyncFn);
      
      await wrappedHandler(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
