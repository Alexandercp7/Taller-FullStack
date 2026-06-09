import { DomainEvent } from './domain-event';

export class OrderCreated extends DomainEvent {
  constructor(
    orderId: string,
    public readonly clientId: string,
    public readonly technicianId: string,
    public readonly createdById: string,
  ) {
    super(orderId);
  }
}
