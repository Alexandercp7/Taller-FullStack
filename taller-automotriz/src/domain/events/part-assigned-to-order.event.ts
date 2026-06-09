import { DomainEvent } from './domain-event';

export class PartAssignedToOrder extends DomainEvent {
  constructor(
    orderId: string,
    public readonly itemId: string,
    public readonly itemName: string,
    public readonly quantity: number,
    public readonly userId: string,
  ) {
    super(orderId);
  }
}
