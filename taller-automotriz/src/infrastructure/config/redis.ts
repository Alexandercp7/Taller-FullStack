import Redis from 'ioredis';
import { env } from './env';

let redisInstance: Redis | null = null;

export function getRedis(): Redis {
  if (!redisInstance) {
    redisInstance = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
    });
  }
  return redisInstance;
}
