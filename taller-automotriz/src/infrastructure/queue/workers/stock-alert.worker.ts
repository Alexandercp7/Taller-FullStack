import { Worker } from 'bullmq';
import Redis from 'ioredis';
import { logger } from '../../config/logger';

export function createStockAlertWorker(redis: Redis) {
  return new Worker(
    'stock-alert',
    async (job) => {
      const { itemId, itemName, currentStock, minStock } = job.data;
      logger.warn({ itemId, itemName, currentStock, minStock }, 'Stock below minimum');
    },
    { connection: redis },
  );
}
