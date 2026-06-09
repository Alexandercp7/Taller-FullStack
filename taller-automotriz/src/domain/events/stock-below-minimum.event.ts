import { DomainEvent } from './domain-event';

export class StockBelowMinimum extends DomainEvent {
  constructor(
    itemId: string,
    public readonly currentStock: number,
    public readonly minStock: number,
    public readonly itemName: string,
  ) {
    super(itemId);
  }
}
