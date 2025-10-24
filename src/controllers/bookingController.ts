import { Request, Response } from 'express';
import { bookingService } from '../services/bookingService';
import { queueService } from '../services/queueService';
import { ReserveBookingRequest } from '../models/booking';
import { asyncHandler } from '../middleware/errorHandler';

export class BookingController {
  // Синхронное бронирование
  reserveBooking = asyncHandler(async (req: Request, res: Response) => {
    const bookingData: ReserveBookingRequest = req.body;
    
    const result = await bookingService.reserveBooking(bookingData);
    
    const statusCode = result.success ? 201 : 400;
    res.status(statusCode).json(result);
  });

  // Асинхронное бронирование через очередь
  reserveBookingAsync = asyncHandler(async (req: Request, res: Response) => {
    const bookingData: ReserveBookingRequest = req.body;

    // Быстрая проверка в кэше
    const hasCachedBooking = await bookingService.getUserBooking(
      bookingData.event_id, 
      bookingData.user_id
    );

    if (hasCachedBooking) {
      res.status(400).json({
        success: false,
        error: 'User already has a booking for this event'
      });
      return;
    }

    // Отправляем в очередь
    const sentToQueue = await queueService.sendBookingRequest(bookingData);
    
    if (!sentToQueue) {
      res.status(500).json({
        success: false,
        error: 'Failed to process booking request'
      });
      return;
    }

    res.status(202).json({
      success: true,
      message: 'Booking request accepted for processing'
    });
  });

  // Получение бронирований пользователя
  getUserBookings = asyncHandler(async (req: Request, res: Response) => {
    const { user_id } = req.params;

    if (!user_id) {
      res.status(400).json({
        success: false,
        error: 'user_id is required'
      });
      return;
    }

    const bookings = await bookingService.getUserBookings(user_id);
    
    res.status(200).json({
      success: true,
      data: bookings
    });
  });

  // Отмена бронирования
  cancelBooking = asyncHandler(async (req: Request, res: Response) => {
    const { booking_id } = req.params;
    const { user_id } = req.body;

    if (!user_id) {
      res.status(400).json({
        success: false,
        error: 'user_id is required'
      });
      return;
    }

    const bookingId = parseInt(booking_id, 10);
    if (isNaN(bookingId)) {
      res.status(400).json({
        success: false,
        error: 'Valid booking_id is required'
      });
      return;
    }

    const success = await bookingService.cancelBooking(bookingId, user_id);
    
    if (!success) {
      res.status(404).json({
        success: false,
        error: 'Booking not found or already cancelled'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully'
    });
  });
}

export const bookingController = new BookingController();