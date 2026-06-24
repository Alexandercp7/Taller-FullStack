import { IDomainEventDispatcher } from '../../application/ports/services/domain-event-dispatcher.port';
import { DomainEvent } from '../../domain/events/domain-event';
import { OrderCreated } from '../../domain/events/order-created.event';
import { OrderClosed } from '../../domain/events/order-closed.event';
import { OrderCancelled } from '../../domain/events/order-cancelled.event';
import { OrderStatusChanged } from '../../domain/events/order-status-changed.event';
import { StockBelowMinimum } from '../../domain/events/stock-below-minimum.event';
import { PaymentRegistered } from '../../domain/events/payment-registered.event';
import { logger } from '../config/logger';

export class InProcessDomainEventDispatcher implements IDomainEventDispatcher {
  async dispatch(events: ReadonlyArray<DomainEvent>): Promise<void> {
    for (const event of events) {
      this.handle(event);
    }
  }

  private handle(event: DomainEvent): void {
    if (event instanceof OrderCreated) {
      logger.info({ orderId: event.aggregateId, clientId: event.clientId }, 'Order created');
      return;
    }
    if (event instanceof OrderStatusChanged) {
      logger.info({ orderId: event.aggregateId, newStatus: event.newStatus }, 'Processing status notification');
      return;
    }
    if (event instanceof OrderClosed) {
      logger.info({ orderId: event.aggregateId, userId: event.userId }, 'Processing order closed notification');
      return;
    }
    if (event instanceof OrderCancelled) {
      logger.info({ orderId: event.aggregateId, reason: event.reason }, 'Order cancelled');
      return;
    }
    if (event instanceof StockBelowMinimum) {
      logger.warn({ itemId: event.aggregateId, itemName: event.itemName, currentStock: event.currentStock, minStock: event.minStock }, 'Stock below minimum');
      return;
    }
    if (event instanceof PaymentRegistered) {
      logger.info({ accountId: event.aggregateId, clientId: event.clientId, amount: event.amount }, 'Payment registered');
      return;
    }
  }
}
