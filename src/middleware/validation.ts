import { Request, Response, NextFunction } from 'express';
import { ReserveBookingRequest } from '../models/booking';

export const validateReserveBooking = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { event_id, user_id }: ReserveBookingRequest = req.body;

  if (!event_id || typeof event_id !== 'number' || event_id <= 0) {
    res.status(400).json({ 
      success: false, 
      error: 'Valid event_id is required' 
    });
    return;
  }

  if (!user_id || typeof user_id !== 'string' || user_id.trim().length === 0) {
    res.status(400).json({ 
      success: false, 
      error: 'Valid user_id is required' 
    });
    return;
  }

  next();
};