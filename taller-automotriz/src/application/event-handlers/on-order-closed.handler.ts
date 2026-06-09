import { OrderClosed } from '../../domain/events/order-closed.event';
import { JobQueue } from '../ports/services/job-queue.port';
import { NotificationSender } from '../ports/services/notification-sender.port';
import { OrderRepository } from '../ports/repositories/order.repository';

export class OnOrderClosedHandler {
  constructor(
    private readonly orderRepo: OrderRepository,
    private readonly jobQueue: JobQueue,
  ) {}

  async handle(event: OrderClosed): Promise<void> {
    await this.jobQueue.enqueue('generate-invoice', { orderId: event.aggregateId });
    await this.jobQueue.enqueue('notify-client-delivery', {
      orderId: event.aggregateId,
      userId: event.userId,
    });
  }
}
