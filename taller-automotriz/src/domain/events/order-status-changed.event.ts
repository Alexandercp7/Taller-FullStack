import { DomainEvent } from './domain-event';

export class OrderStatusChanged extends DomainEvent {
  constructor(
    orderId: string,
    public readonly previousStatus: string,
    public readonly newStatus: string,
    public readonly userId: string,
  ) {
    super(orderId);
  }
}
