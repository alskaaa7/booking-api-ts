import express from 'express';
import { bookingRoutes } from './routes/bookingRoutes';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use('/api/bookings', bookingRoutes);
app.use(errorHandler);

// Добавляем health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Booking API is running' });
});

app.get('/api/bookings/health', (req, res) => {
  res.json({ status: 'OK', message: 'Booking service is healthy' });
});

// ЗАПУСК СЕРВЕРА (этого не было!)
app.listen(PORT, () => {
  console.log(`🚀 Server started on http://localhost:${PORT}`);
  console.log(`✅ Health check: http://localhost:${PORT}/health`);
  console.log(`✅ API: http://localhost:${PORT}/api/bookings/reserve`);
}).on('error', (error) => {
  console.error('❌ Server failed to start:', error);
});

export default app;