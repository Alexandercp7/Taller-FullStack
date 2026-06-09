import { IDomainEventDispatcher } from '../../application/ports/services/domain-event-dispatcher.port';
import { JobQueue } from '../../application/ports/services/job-queue.port';
import { DomainEvent } from '../../domain/events/domain-event';
import { OrderCreated } from '../../domain/events/order-created.event';
import { OrderClosed } from '../../domain/events/order-closed.event';
import { OrderCancelled } from '../../domain/events/order-cancelled.event';
import { OrderStatusChanged } from '../../domain/events/order-status-changed.event';
import { StockBelowMinimum } from '../../domain/events/stock-below-minimum.event';
import { PaymentRegistered } from '../../domain/events/payment-registered.event';

export class BullMQDomainEventDispatcher implements IDomainEventDispatcher {
  constructor(private readonly jobQueue: JobQueue) {}

  async dispatch(events: ReadonlyArray<DomainEvent>): Promise<void> {
    for (const event of events) {
      await this.handle(event);
    }
  }

  private async handle(event: DomainEvent): Promise<void> {
    if (event instanceof OrderCreated) {
      await this.jobQueue.enqueue('order-created', {
        orderId: event.aggregateId,
        clientId: event.clientId,
        technicianId: event.technicianId,
      });
      return;
    }

    if (event instanceof OrderStatusChanged) {
      await this.jobQueue.enqueue('send-status-notification', {
        orderId: event.aggregateId,
        newStatus: event.newStatus,
      });
      return;
    }

    if (event instanceof OrderClosed) {
      await this.jobQueue.enqueue('order-closed-notification', {
        orderId: event.aggregateId,
        userId: event.userId,
      });
      return;
    }

    if (event instanceof OrderCancelled) {
      await this.jobQueue.enqueue('order-cancelled', {
        orderId: event.aggregateId,
        userId: event.userId,
        reason: event.reason,
      });
      return;
    }

    if (event instanceof StockBelowMinimum) {
      await this.jobQueue.enqueue('stock-alert', {
        itemId: event.aggregateId,
        itemName: event.itemName,
        currentStock: event.currentStock,
        minStock: event.minStock,
      });
      return;
    }

    if (event instanceof PaymentRegistered) {
      await this.jobQueue.enqueue('payment-registered', {
        accountId: event.aggregateId,
        clientId: event.clientId,
        amount: event.amount,
        fullyPaid: event.isPaid,
      });
      return;
    }
  }
}
