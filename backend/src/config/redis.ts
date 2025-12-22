import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export let isRedisConnected = false;

export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  retryStrategy: (times) => {
    if (times > 3) {
      console.log('Redis connection failed after 3 attempts. Running without Redis.');
      return null; // Stop retrying
    }
    return Math.min(times * 100, 3000);
  },
  lazyConnect: true,
});

redis.on('connect', () => {
  console.log('Redis connected successfully');
  isRedisConnected = true;
});

redis.on('error', () => {
  // Silently handle - we already logged on connect failure
});

// Try to connect but don't block startup
export const connectRedis = async (): Promise<void> => {
  try {
    await redis.connect();
  } catch {
    console.log('Redis not available - queue features disabled');
  }
};

export default redis;
