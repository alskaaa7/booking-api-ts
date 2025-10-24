import { Router } from 'express';
import { bookingController } from '../controllers/bookingController';
import { validateReserveBooking } from '../middleware/validation';

const router = Router();

// Бронирование места (синхронное)
router.post('/reserve', validateReserveBooking, bookingController.reserveBooking);

// Бронирование места (асинхронное через очередь)
router.post('/reserve-async', validateReserveBooking, bookingController.reserveBookingAsync);

// Получение бронирований пользователя
router.get('/user/:user_id', bookingController.getUserBookings);

// Отмена бронирования
router.delete('/:booking_id', bookingController.cancelBooking);

export const bookingRoutes = router;