import { DomainEvent } from './domain-event';

export class PaymentDueSoon extends DomainEvent {
  constructor(
    paymentId: string,
    public readonly dueDate: Date,
    public readonly amount: number,
    public readonly description: string,
  ) {
    super(paymentId);
  }
}
