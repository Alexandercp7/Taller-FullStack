import { Worker } from 'bullmq';
import Redis from 'ioredis';
import { logger } from '../../config/logger';

export function createCloseOrderWorker(redis: Redis) {
  return new Worker(
    'order-closed-notification',
    async (job) => {
      const { orderId, clientId } = job.data;
      logger.info({ orderId, clientId }, 'Processing order closed notification');
    },
    { connection: redis },
  );
}
