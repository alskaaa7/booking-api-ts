import Redis from 'ioredis';

export const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  lazyConnect: true,
  showFriendlyErrorStack: true,
});

redis.on('error', (err) => {
  console.error('Redis error:', err);
});

redis.on('connect', () => {
  console.log('Connected to Redis');
});

export const initRedis = async () => {
  try {
    await redis.ping();
    console.log('Redis connected successfully');
    return true;
  } catch (error) {
    console.error('Redis connection failed:', error);
    return false;
  }
};