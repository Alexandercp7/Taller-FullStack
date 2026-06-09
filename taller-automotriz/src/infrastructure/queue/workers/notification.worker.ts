import { Worker } from 'bullmq';
import Redis from 'ioredis';
import { logger } from '../../config/logger';

export function createNotificationWorker(redis: Redis) {
  return new Worker(
    'send-status-notification',
    async (job) => {
      const { orderId, newStatus } = job.data;
      logger.info({ orderId, newStatus }, 'Processing status notification');
    },
    { connection: redis },
  );
}
