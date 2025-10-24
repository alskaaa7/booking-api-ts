import { getChannel } from '../config/rabbitmq';
import { ReserveBookingRequest } from '../models/booking';

export class QueueService {
  private readonly BOOKING_QUEUE = 'booking_queue';
  private readonly BOOKING_EXCHANGE = 'booking_exchange';

  async sendBookingRequest(bookingData: ReserveBookingRequest): Promise<boolean> {
    try {
      const channel = getChannel();
      const messageBuffer = Buffer.from(JSON.stringify({
        ...bookingData,
        timestamp: new Date().toISOString()
      }));

      return channel.publish(
        this.BOOKING_EXCHANGE,
        'reserve',
        messageBuffer,
        { persistent: true }
      );
    } catch (error) {
      console.error('Failed to send booking request to queue:', error);
      return false;
    }
  }

  async processBookingMessages(
    callback: (bookingData: ReserveBookingRequest) => Promise<void>
  ): Promise<void> {
    try {
      const channel = getChannel();
      
      await channel.assertQueue(this.BOOKING_QUEUE, { durable: true });
      await channel.prefetch(1);

      console.log('Waiting for booking messages...');

      await channel.consume(this.BOOKING_QUEUE, async (msg) => {
        if (!msg) return;

        try {
          const bookingData: ReserveBookingRequest = JSON.parse(msg.content.toString());
          console.log('Processing booking request from queue:', bookingData);
          
          await callback(bookingData);
          channel.ack(msg);
          console.log('Booking request processed successfully');
        } catch (error) {
          console.error('Error processing booking message:', error);
          channel.nack(msg, false, false);
        }
      });
    } catch (error) {
      console.error('Error setting up message processor:', error);
      throw error;
    }
  }
}

export const queueService = new QueueService();