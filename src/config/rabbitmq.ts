import amqp, { Channel } from 'amqplib';

let channel: Channel | null = null;

export const connectRabbitMQ = async (): Promise<Channel> => {
  try {
    const rabbitUrl = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
    const connection = await amqp.connect(rabbitUrl);
    channel = await connection.createChannel();
    
    await channel.assertExchange('booking_exchange', 'direct', { durable: true });
    await channel.assertQueue('booking_queue', { durable: true });
    await channel.bindQueue('booking_queue', 'booking_exchange', 'reserve');
    
    console.log('RabbitMQ connected successfully');
    return channel;
  } catch (error) {
    console.error('Failed to connect to RabbitMQ:', error);
    throw error;
  }
};

export const getChannel = (): Channel => {
  if (!channel) {
    throw new Error('RabbitMQ channel not initialized. Call connectRabbitMQ first.');
  }
  return channel;
};

export const closeRabbitMQ = async (): Promise<void> => {
  if (channel) {
    await channel.close();
    channel = null;
  }
};