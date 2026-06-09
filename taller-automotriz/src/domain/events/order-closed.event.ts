import { DomainEvent } from './domain-event';

export class OrderClosed extends DomainEvent {
  constructor(
    orderId: string,
    public readonly userId: string,
  ) {
    super(orderId);
  }
}
