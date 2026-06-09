import { StockBelowMinimum } from '../../domain/events/stock-below-minimum.event';
import { JobQueue } from '../ports/services/job-queue.port';

export class OnStockBelowMinimumHandler {
  constructor(private readonly jobQueue: JobQueue) {}

  async handle(event: StockBelowMinimum): Promise<void> {
    await this.jobQueue.enqueue('stock-alert-push', {
      itemId: event.aggregateId,
      itemName: event.itemName,
      currentStock: event.currentStock,
      minStock: event.minStock,
    });
  }
}
