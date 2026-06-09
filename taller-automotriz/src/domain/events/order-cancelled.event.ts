import { DomainEvent } from './domain-event';

export class OrderCancelled extends DomainEvent {
  constructor(
    orderId: string,
    public readonly userId: string,
    public readonly reason: string,
  ) {
    super(orderId);
  }
}
