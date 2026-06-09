import { OrderStatusChanged } from '../../domain/events/order-status-changed.event';
import { JobQueue } from '../ports/services/job-queue.port';

export class OnStatusChangedHandler {
  constructor(private readonly jobQueue: JobQueue) {}

  async handle(event: OrderStatusChanged): Promise<void> {
    await this.jobQueue.enqueue('send-status-notification', {
      orderId: event.aggregateId,
      previousStatus: event.previousStatus,
      newStatus: event.newStatus,
      userId: event.userId,
    });
  }
}
